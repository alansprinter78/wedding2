"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Heart, MapPin, Calendar, Clock, Gift, Music, X, Volume2, VolumeX } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function WeddingInvitation() {
  const [isInvitationOpen, setIsInvitationOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const [formData, setFormData] = useState({
    name: "",
    attendance: "",
    guests: "",
    message: "",
  })
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.5)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const [messages, setMessages] = useState<
    Array<{
      id: string
      guest_name: string
      attendance: boolean
      guest_count: number
      message: string
      created_at: string
    }>
  >([])

  const searchParams = useSearchParams()
  const guestName = searchParams?.get("guest") || ""

  useEffect(() => {
    if (guestName) {
      setFormData((prev) => ({ ...prev, name: decodeURIComponent(guestName) }))
    } else {
      setFormData((prev) => ({ ...prev, name: "Tamu" }))
    }
  }, [guestName])

  const weddingDate = new Date("2026-06-26T10:00:00")

  const galleryImages = [
    "/romantic-couple-photo-1.png",
    "/romantic-couple-moment.png",
    "/romantic-couple-photo-3.jpg",
    "/romantic-couple-photo-4.jpg",
    "/romantic-couple-photo-5.jpg",
    "/romantic-couple-photo-6.jpg",
  ]

  const supabase = createClient()

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
      audioRef.current.loop = true
    }
  }, [volume])

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying && !isMuted) {
        audioRef.current.play().catch(console.error)
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying, isMuted])

  useEffect(() => {
    // Load initial messages from Supabase
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("rsvp_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) {
        console.error("Error loading messages:", error)
      } else if (data) {
        setMessages(data)
      }
    }

    loadMessages()

    // Set up real-time subscription
    const channel = supabase
      .channel("rsvp_messages_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rsvp_messages",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setMessages((prev) => [payload.new as any, ...prev].slice(0, 20))
          } else if (payload.eventType === "DELETE") {
            setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime()
      const distance = weddingDate.getTime() - now

      if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24))
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((distance % (1000 * 60)) / 1000)

        setTimeLeft({ days, hours, minutes, seconds })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [weddingDate])

  const openInvitation = () => {
    setIsInvitationOpen(true)
    setIsPlaying(true)
  }

  const toggleMusic = () => {
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number.parseFloat(e.target.value)
    setVolume(newVolume)
    if (newVolume === 0) {
      setIsMuted(true)
    } else if (isMuted) {
      setIsMuted(false)
    }
  }

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index)
    setIsLightboxOpen(true)
  }

  const closeLightbox = () => {
    setIsLightboxOpen(false)
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.message.trim()) {
      try {
        const guestNameToSave = guestName ? decodeURIComponent(guestName) : "Tamu"

        const { data, error } = await supabase.from("rsvp_messages").insert({
          guest_name: guestNameToSave,
          message: formData.message,
          attendance: formData.attendance, // simpan string langsung
          guest_count: formData.attendance === "hadir" ? Number.parseInt(formData.guests) || 1 : 0,
        })
        

        if (error) {
          console.error("Error saving message:", error)
          alert(`Terjadi kesalahan saat menyimpan pesan: ${error.message}. Silakan coba lagi.`)
          return
        }

        alert("Terima kasih atas konfirmasi kehadiran Anda!")
        setFormData((prev) => ({ ...prev, attendance: "", guests: "", message: "" }))
      } catch (err) {
        console.error("Unexpected error:", err)
        alert("Terjadi kesalahan yang tidak terduga. Silakan coba lagi.")
      }
    }
  }

  if (!isInvitationOpen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-amber-50 flex items-center justify-center p-4">
        <div
          className="text-center max-w-sm sm:max-w-md mx-auto parallax-bg rounded-3xl p-6 sm:p-8 shadow-2xl"
          style={{
            backgroundImage: `url('/romantic-floral-background.jpg')`,
          }}
        >
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 sm:p-8">
            <div className="mb-6">
              <Heart className="w-10 h-10 sm:w-12 sm:h-12 text-rose-400 mx-auto mb-4 float-animation" />
              <h1 className="font-serif text-2xl sm:text-4xl text-gray-800 mb-2">Undangan Pernikahan</h1>
              <div className="w-20 sm:w-24 h-0.5 bg-gradient-to-r from-rose-300 to-amber-300 mx-auto mb-4"></div>
            </div>

            {guestName && (
              <div className="mb-6 p-3 sm:p-4 bg-gradient-to-r from-rose-100 to-amber-100 rounded-xl">
                <p className="text-gray-700 text-base sm:text-lg font-medium">Kepada Yth.</p>
                <p className="text-gray-800 text-lg sm:text-xl font-serif break-words">
                  {decodeURIComponent(guestName)}
                </p>
                <p className="text-gray-600 text-sm mt-1">Di tempat</p>
              </div>
            )}

            <div className="mb-8">
              <h2 className="font-serif text-2xl sm:text-3xl text-gray-700 mb-2">Maulana & Nurul</h2>
              <p className="text-gray-600 text-base sm:text-lg">26 Juni 2026</p>
            </div>

            <Button
              onClick={openInvitation}
              className="glow-animation bg-gradient-to-r from-rose-400 to-amber-400 hover:from-rose-500 hover:to-amber-500 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-full text-base sm:text-lg font-medium shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              Buka Undangan
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-25 to-amber-25">
      <audio ref={audioRef} src="/wedding-background-music.mp3" preload="auto" />

      <div className="fixed top-2 sm:top-4 right-2 sm:right-4 z-50 flex items-center space-x-1 sm:space-x-2">
        <div className="bg-white/80 backdrop-blur-sm rounded-full p-1 sm:p-2 shadow-lg flex items-center space-x-1 sm:space-x-2">
          <Button
            onClick={toggleMute}
            className="bg-transparent hover:bg-white/20 text-gray-700 rounded-full p-1 sm:p-2"
            size="sm"
          >
            {isMuted ? <VolumeX className="w-3 h-3 sm:w-4 sm:h-4" /> : <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />}
          </Button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-12 sm:w-16 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #f43f5e 0%, #f43f5e ${(isMuted ? 0 : volume) * 100}%, #d1d5db ${(isMuted ? 0 : volume) * 100}%, #d1d5db 100%)`,
            }}
          />
        </div>

        <Button
          onClick={toggleMusic}
          className="bg-white/80 backdrop-blur-sm hover:bg-white/90 text-gray-700 rounded-full p-2 sm:p-3 shadow-lg"
        >
          <Music
            className={`w-4 h-4 sm:w-5 sm:h-5 ${isPlaying && !isMuted ? "text-rose-500 animate-pulse" : "text-gray-500"}`}
          />
        </Button>
      </div>

      <section
        className="relative min-h-screen flex items-center justify-center parallax-bg px-4"
        style={{
          backgroundImage: `url('/romantic-wedding-flowers.png')`,
        }}
      >
        <div className="text-center text-white bg-black/30 backdrop-blur-sm rounded-3xl p-6 sm:p-8 md:p-12 max-w-xs sm:max-w-2xl mx-4">
          <div className="fade-in-up">
            <p className="text-base sm:text-xl mb-4">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم</p>
            <p className="text-sm sm:text-lg mb-6 sm:mb-8">Dengan memohon rahmat dan ridho Allah SWT</p>

            <h1 className="font-serif text-3xl sm:text-4xl md:text-6xl mb-4">Maulana & Nurul</h1>
            <div className="w-24 sm:w-32 h-0.5 bg-gradient-to-r from-rose-300 to-amber-300 mx-auto mb-6 sm:mb-8"></div>

            <p className="text-lg sm:text-xl mb-2">Jumat, 26 Juni 2026</p>
            <p className="text-base sm:text-lg">Pukul 08.00 WIB - Selesai</p>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="fade-in-up">
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-gray-800 mb-6 sm:mb-8">
              Assalamu'alaikum Wr. Wb.
            </h2>
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-6 sm:mb-8 max-w-3xl mx-auto">
              Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud mengundang Bapak/Ibu/Saudara/i untuk menghadiri
              acara pernikahan kami yang insya Allah akan diselenggarakan pada:
            </p>

            <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 max-w-2xl mx-auto">
              <p className="text-gray-700 text-base sm:text-lg italic mb-4 leading-relaxed">
                "Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu isteri-isteri dari jenismu
                sendiri, supaya kamu cenderung dan merasa tenteram kepadanya, dan dijadikan-Nya diantaramu rasa kasih
                dan sayang. Sesungguhnya pada yang demikian itu benar-benar terdapat tanda-tanda bagi kaum yang
                berfikir."
              </p>
              <p className="text-gray-600 font-medium">QS. Ar-Rum: 21</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-20 px-4 bg-gradient-to-r from-rose-50 to-amber-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="text-center fade-in-up">
              <div className="relative mb-6">
                <img
                  src="/groom-portrait-photo.jpg"
                  alt="Maulana"
                  className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full mx-auto object-cover shadow-2xl border-4 sm:border-8 border-white"
                />
                <div className="absolute -bottom-2 sm:-bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-full p-2 sm:p-3 shadow-lg">
                  <Heart className="w-4 h-4 sm:w-6 sm:h-6 text-rose-500" />
                </div>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl md:text-3xl text-gray-800 mb-2">Maulana Zulfa Abduloh</h3>
              <p className="text-gray-600 mb-4">Putra dari</p>
              <p className="text-gray-700 font-medium text-sm sm:text-base">Bapak Kholil Abdillah & Ibu Siti Asiyah</p>
            </div>

            <div className="text-center fade-in-up">
              <div className="relative mb-6">
                <img
                  src="/bride-portrait-photo.jpg"
                  alt="Nurul"
                  className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full mx-auto object-cover shadow-2xl border-4 sm:border-8 border-white"
                />
                <div className="absolute -bottom-2 sm:-bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-full p-2 sm:p-3 shadow-lg">
                  <Heart className="w-4 h-4 sm:w-6 sm:h-6 text-rose-500" />
                </div>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl md:text-3xl text-gray-800 mb-2">Nurul Avina Amalia</h3>
              <p className="text-gray-600 mb-4">Putri dari</p>
              <p className="text-gray-700 font-medium text-sm sm:text-base">Bapak Sukarman & Ibu Nur Fadilah</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-center text-gray-800 mb-12 sm:mb-16">
            Perjalanan Cinta Kami
          </h2>

          <div className="relative">
            <div className="hidden sm:block absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-rose-300 to-amber-300 rounded-full"></div>

            <div className="space-y-8 sm:space-y-16">
              <div className="relative flex items-start">
                <div className="sm:absolute sm:left-1/2 sm:transform sm:-translate-x-1/2 w-12 h-12 bg-rose-400 rounded-full flex items-center justify-center shadow-lg z-10 flex-shrink-0 mr-4 sm:mr-0">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 sm:w-1/2 sm:pr-8 text-left sm:text-right fade-in-up">
                  <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border-l-4 sm:border-l-4 border-rose-400">
                    <h3 className="font-serif text-lg sm:text-xl text-gray-800 mb-2">Pertemuan Pertama</h3>
                    <p className="text-rose-600 font-medium mb-3">Juni 2021</p>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Takdir mempertemukan kami di Pondok Pesantren Khoirul Huda Surabaya, Nginden. Satu pandangan
                      pertama, dan hati sudah berbisik bahwa dia adalah yang istimewa.
                    </p>
                  </div>
                </div>
                <div className="hidden sm:block w-1/2 pl-8"></div>
              </div>

              <div className="relative flex items-start">
                <div className="sm:absolute sm:left-1/2 sm:transform sm:-translate-x-1/2 w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center shadow-lg z-10 flex-shrink-0 mr-4 sm:mr-0">
                  <span className="text-white text-lg">💭</span>
                </div>
                <div className="flex-1 sm:w-1/2 sm:pr-8 sm:order-2 text-left fade-in-up">
                  <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border-l-4 sm:border-r-4 sm:border-l-0 border-gray-400">
                    <h3 className="font-serif text-lg sm:text-xl text-gray-800 mb-2">Terpisah Sementara</h3>
                    <p className="text-gray-600 font-medium mb-3">2021 - 2022</p>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Setelah pertemuan pertama, kami sempat tidak pernah bertemu lagi. Takdir seolah memisahkan kami
                      untuk sementara waktu.
                    </p>
                  </div>
                </div>
                <div className="hidden sm:block w-1/2 pl-8 order-1"></div>
              </div>

              <div className="relative flex items-start">
                <div className="sm:absolute sm:left-1/2 sm:transform sm:-translate-x-1/2 w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center shadow-lg z-10 flex-shrink-0 mr-4 sm:mr-0">
                  <span className="text-white text-lg">🌙</span>
                </div>
                <div className="flex-1 sm:w-1/2 sm:pr-8 text-left sm:text-right fade-in-up">
                  <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border-l-4 border-amber-400">
                    <h3 className="font-serif text-lg sm:text-xl text-gray-800 mb-2">Bertemu Kembali</h3>
                    <p className="text-amber-600 font-medium mb-3">April 2022</p>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Allah mempertemukan kami kembali saat buka bersama di bulan Ramadhan. Hanya sekali pertemuan,
                      namun cukup untuk mengingatkan perasaan yang pernah ada.
                    </p>
                  </div>
                </div>
                <div className="hidden sm:block w-1/2 pl-8"></div>
              </div>

              <div className="relative flex items-start">
                <div className="sm:absolute sm:left-1/2 sm:transform sm:-translate-x-1/2 w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center shadow-lg z-10 flex-shrink-0 mr-4 sm:mr-0">
                  <span className="text-white text-lg">💬</span>
                </div>
                <div className="flex-1 sm:w-1/2 sm:pr-8 sm:order-2 text-left fade-in-up">
                  <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border-l-4 sm:border-r-4 sm:border-l-0 border-blue-400">
                    <h3 className="font-serif text-lg sm:text-xl text-gray-800 mb-2">Mulai Berkomunikasi</h3>
                    <p className="text-blue-600 font-medium mb-3">Agustus 2023</p>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Karena ada suatu urusan, kami mulai berkomunikasi kembali. Dari komunikasi sederhana, perlahan
                      hati mulai terbuka.
                    </p>
                  </div>
                </div>
                <div className="hidden sm:block w-1/2 pl-8 order-1"></div>
              </div>

              <div className="relative flex items-start">
                <div className="sm:absolute sm:left-1/2 sm:transform sm:-translate-x-1/2 w-12 h-12 bg-rose-400 rounded-full flex items-center justify-center shadow-lg z-10 flex-shrink-0 mr-4 sm:mr-0">
                  <span className="text-white text-lg">💕</span>
                </div>
                <div className="flex-1 sm:w-1/2 sm:pr-8 text-left sm:text-right fade-in-up">
                  <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border-l-4 border-rose-400">
                    <h3 className="font-serif text-lg sm:text-xl text-gray-800 mb-2">Masa Taaruf</h3>
                    <p className="text-rose-600 font-medium mb-3">2023 - 2026</p>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Dengan niat yang serius dan restu kedua orang tua, kami menjalani masa taaruf untuk saling
                      mengenal lebih dalam dengan cara yang islami.
                    </p>
                  </div>
                </div>
                <div className="hidden sm:block w-1/2 pl-8"></div>
              </div>

              <div className="relative flex items-start">
                <div className="sm:absolute sm:left-1/2 sm:transform sm:-translate-x-1/2 w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center shadow-lg z-10 flex-shrink-0 mr-4 sm:mr-0">
                  <span className="text-white text-lg">💍</span>
                </div>
                <div className="flex-1 sm:w-1/2 sm:pr-8 sm:order-2 text-left fade-in-up">
                  <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border-l-4 sm:border-r-4 sm:border-l-0 border-amber-400">
                    <h3 className="font-serif text-lg sm:text-xl text-gray-800 mb-2">Lamaran & Persiapan</h3>
                    <p className="text-amber-600 font-medium mb-3">Januari - April 2026</p>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Dengan penuh syukur, kami mengucapkan ikrar lamaran dan mulai mempersiapkan hari bahagia kami
                      dengan penuh doa dan harapan.
                    </p>
                  </div>
                </div>
                <div className="hidden sm:block w-1/2 pl-8 order-1"></div>
              </div>

              <div className="relative flex items-start">
                <div className="sm:absolute sm:left-1/2 sm:transform sm:-translate-x-1/2 w-16 h-16 bg-gradient-to-r from-rose-500 to-amber-500 rounded-full flex items-center justify-center shadow-xl animate-pulse z-10 flex-shrink-0 mr-4 sm:mr-0">
                  <span className="text-white text-2xl">💒</span>
                </div>
                <div className="flex-1 sm:w-1/2 sm:pr-8 text-left sm:text-right fade-in-up">
                  <div className="bg-gradient-to-r from-rose-50 to-amber-50 rounded-2xl shadow-xl p-6 sm:p-8 border-l-4 border-gradient-to-b from-rose-400 to-amber-400">
                    <h3 className="font-serif text-xl sm:text-2xl text-gray-800 mb-2">Hari Pernikahan</h3>
                    <p className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-600 font-bold mb-3">
                      26 Juni 2026
                    </p>
                    <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                      Hari yang telah kami nanti-nantikan. Insya Allah, kami akan menjadi pasangan suami istri yang
                      sakinah, mawaddah, wa rahmah.
                    </p>
                  </div>
                </div>
                <div className="hidden sm:block w-1/2 pl-8"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-center text-gray-800 mb-12 sm:mb-16">
            Detail Acara
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <Card className="bg-white shadow-xl rounded-2xl overflow-hidden fade-in-up">
              <CardContent className="p-6 sm:p-8">
                <div className="text-center mb-6">
                  <div className="bg-rose-100 rounded-full p-3 sm:p-4 w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4">
                    <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-rose-600" />
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl text-gray-800 mb-2">Akad Nikah</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">Jumat, 26 Juni 2026</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">08.00 - 09.00 WIB</span>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-gray-700 font-medium text-sm sm:text-base">Pakuwon Imperial Ballroom</p>
                      <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                        Villa Bukit Regency Pakuwon Indah, Jl. Lontar, Lidah Wetan, Kec. Lakarsantri, Kota Surabaya,
                        Jawa Timur 60211, Indonesia
                      </p>
                    </div>
                  </div>
                </div>

                <Button className="w-full mt-6 bg-rose-500 hover:bg-rose-600 text-white text-sm sm:text-base">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Lihat Lokasi
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-xl rounded-2xl overflow-hidden fade-in-up">
              <CardContent className="p-6 sm:p-8">
                <div className="text-center mb-6">
                  <div className="bg-amber-100 rounded-full p-3 sm:p-4 w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4">
                    <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600" />
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl text-gray-800 mb-2">Resepsi</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">Jumat, 26 Juni 2026</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">09.00 - 14.00 WIB</span>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-gray-700 font-medium text-sm sm:text-base">Pakuwon Imperial Ballroom</p>
                      <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                        Villa Bukit Regency Pakuwon Indah, Jl. Lontar, Lidah Wetan, Kec. Lakarsantri, Kota Surabaya,
                        Jawa Timur 60211, Indonesia
                      </p>
                    </div>
                  </div>
                </div>

                <Button className="w-full mt-6 bg-amber-500 hover:bg-amber-600 text-white text-sm sm:text-base">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Lihat Lokasi
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-20 px-4 bg-gradient-to-r from-rose-100 to-amber-100">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-12">
            <h2 className="font-serif text-2xl sm:text-3xl text-gray-800 mb-6 sm:mb-8">Menuju Hari Bahagia</h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg">
                <div className="text-2xl sm:text-3xl font-bold text-rose-600 mb-2 transition-all duration-300">
                  {timeLeft.days}
                </div>
                <div className="text-gray-600 text-xs sm:text-sm">Hari</div>
              </div>
              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg">
                <div className="text-2xl sm:text-3xl font-bold text-rose-600 mb-2 transition-all duration-300">
                  {timeLeft.hours}
                </div>
                <div className="text-gray-600 text-xs sm:text-sm">Jam</div>
              </div>
              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg">
                <div className="text-2xl sm:text-3xl font-bold text-rose-600 mb-2 transition-all duration-300">
                  {timeLeft.minutes}
                </div>
                <div className="text-gray-600 text-xs sm:text-sm">Menit</div>
              </div>
              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg">
                <div className="text-2xl sm:text-3xl font-bold text-rose-600 mb-2 transition-all duration-300 animate-pulse">
                  {timeLeft.seconds}
                </div>
                <div className="text-gray-600 text-xs sm:text-sm">Detik</div>
              </div>
            </div>

            <div className="mt-6 sm:mt-8">
              {timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0 ? (
                <p className="text-xl sm:text-2xl font-serif text-rose-600 animate-bounce">
                  🎉 Hari Bahagia Telah Tiba! 🎉
                </p>
              ) : (
                <p className="text-base sm:text-lg text-gray-600">
                  {timeLeft.days > 0 && `${timeLeft.days} hari lagi menuju hari bahagia kami`}
                  {timeLeft.days === 0 && timeLeft.hours > 0 && `${timeLeft.hours} jam lagi!`}
                  {timeLeft.days === 0 &&
                    timeLeft.hours === 0 &&
                    timeLeft.minutes > 0 &&
                    `${timeLeft.minutes} menit lagi!`}
                  {timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && "Kurang dari 1 menit lagi!"}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-center text-gray-800 mb-12 sm:mb-16">
            Galeri Foto
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {galleryImages.map((image, index) => (
              <div
                key={index}
                className="relative group cursor-pointer overflow-hidden rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                onClick={() => openLightbox(index)}
              >
                <img
                  src={image || "/placeholder.svg"}
                  alt={`Gallery ${index + 1}`}
                  className="w-full h-48 sm:h-56 md:h-64 object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-20 px-4 bg-gradient-to-r from-rose-50 to-amber-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-center text-gray-800 mb-6 sm:mb-8">
            Konfirmasi Kehadiran
          </h2>
          <p className="text-center text-gray-600 mb-8 sm:mb-12 text-sm sm:text-base">
            Mohon konfirmasi kehadiran Anda sebelum tanggal 20 Juni 2026
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            <Card className="bg-white shadow-xl rounded-2xl">
              <CardContent className="p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2 text-sm sm:text-base">Nama Tamu</label>
                    <div className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-sm sm:text-base">
                      {formData.name}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {guestName ? "Nama dari link undangan personal" : "Tamu umum"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2 text-sm sm:text-base">
                      Konfirmasi Kehadiran
                    </label>
                    <select
  name="attendance"
  value={formData.attendance}
  onChange={handleInputChange}
  required
  className="w-full p-3 border border-gray-300 rounded-lg ..."
>
  <option value="">Pilih konfirmasi kehadiran</option>
  <option value="hadir">Hadir</option>
  <option value="tidak-hadir">Tidak Hadir</option>
  <option value="ragu-ragu">Ragu-ragu</option>
</select>

                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2 text-sm sm:text-base">Jumlah Tamu</label>
                    <Input
                      type="number"
                      name="guests"
                      value={formData.guests}
                      onChange={handleInputChange}
                      placeholder="Jumlah tamu yang akan hadir"
                      min="1"
                      className="w-full text-sm sm:text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2 text-sm sm:text-base">Pesan & Doa</label>
                    <Textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Berikan pesan dan doa untuk kedua mempelai"
                      rows={4}
                      className="w-full text-sm sm:text-base"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white py-3 rounded-lg text-base sm:text-lg font-medium"
                  >
                    Kirim Konfirmasi
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-xl rounded-2xl">
              <CardContent className="p-6 sm:p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-serif text-lg sm:text-2xl text-gray-800">Konfirmasi Kehadiran Terbaru</h3>
                </div>

                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <Heart className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-sm sm:text-base">Belum ada konfirmasi. Jadilah yang pertama!</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-80 sm:max-h-96 overflow-y-auto">
                    {messages.slice(0, 10).map((msg) => (
                      <div
                        key={msg.id}
                        className="bg-gradient-to-r from-rose-50 to-amber-50 p-4 sm:p-5 rounded-xl border border-rose-100 shadow-sm animate-fade-in"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 space-y-2 sm:space-y-0">
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                            <h4 className="font-semibold text-gray-800 text-sm sm:text-base break-words">
                              {msg.guest_name}
                            </h4>
                            <span
  className={`px-2 py-1 rounded-full text-xs font-medium self-start ${
    msg.attendance === "hadir"
      ? "bg-green-100 text-green-700"
      : msg.attendance === "tidak-hadir"
      ? "bg-red-100 text-red-700"
      : "bg-yellow-100 text-yellow-700"
  }`}
>
  {msg.attendance === "hadir"
    ? "✓ Hadir"
    : msg.attendance === "tidak-hadir"
    ? "✗ Tidak Hadir"
    : "🤔 Ragu-ragu"}
</span>

                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(msg.created_at).toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {msg.attendance && msg.guest_count > 0 && (
                          <div className="flex items-center mb-2">
                            <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                              <span className="mr-1">👥</span>
                              {msg.guest_count} {msg.guest_count === 1 ? "orang" : "orang"}
                            </div>
                          </div>
                        )}

                        {msg.message && (
                          <div className="bg-white/70 p-3 rounded-lg border-l-3 border-rose-300">
                            <p className="text-gray-700 text-xs sm:text-sm leading-relaxed italic break-words">
                              "{msg.message}"
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {messages.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="bg-green-50 p-3 rounded-lg">
                      <div className="grid grid-cols-4 gap-4 text-center">
  {/* Akan Hadir */}
  <div className="bg-green-50 p-3 rounded-lg">
    <div className="text-base sm:text-lg font-bold text-green-600">
      {messages.filter((msg) => msg.attendance === "hadir").length}
    </div>
    <div className="text-xs text-green-700">Akan Hadir</div>
  </div>

  {/* Tidak Hadir */}
  <div className="bg-red-50 p-3 rounded-lg">
    <div className="text-base sm:text-lg font-bold text-red-600">
      {messages.filter((msg) => msg.attendance === "tidak-hadir").length}
    </div>
    <div className="text-xs text-red-700">Tidak Hadir</div>
  </div>

  {/* Ragu-ragu */}
  <div className="bg-yellow-50 p-3 rounded-lg">
    <div className="text-base sm:text-lg font-bold text-yellow-600">
      {messages.filter((msg) => msg.attendance === "ragu-ragu").length}
    </div>
    <div className="text-xs text-yellow-700">Ragu-ragu</div>
  </div>

  {/* Total Tamu */}
  <div className="bg-blue-50 p-3 rounded-lg">
    <div className="text-base sm:text-lg font-bold text-blue-600">
      {messages
        .filter((msg) => msg.attendance === "hadir" && msg.guest_count > 0)
        .reduce((total, msg) => total + msg.guest_count, 0)}
    </div>
    <div className="text-xs text-blue-700">Total Tamu</div>
  </div>
</div>

                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-gray-800 mb-6 sm:mb-8">Hadiah Digital</h2>
          <p className="text-gray-600 mb-8 sm:mb-12 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Doa restu Anda merupakan karunia yang sangat berarti bagi kami. Namun jika memberi adalah ungkapan tanda
            kasih, Anda dapat memberi kado secara cashless.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-2xl mx-auto">
            <Card className="bg-white shadow-xl rounded-2xl">
              <CardContent className="p-6 sm:p-8 text-center">
                <div className="bg-blue-100 rounded-full p-3 sm:p-4 w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4">
                  <Gift className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                </div>
                <h3 className="font-medium text-gray-800 mb-4 text-base sm:text-lg">Transfer Bank</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Bank BCA</p>
                  <p className="font-mono text-base sm:text-lg text-gray-800">1234567890</p>
                  <p className="font-medium text-xs sm:text-sm">a.n. Maulana Zulfa Abduloh</p>
                </div>
                <Button className="mt-4 bg-blue-500 hover:bg-blue-600 text-white text-sm sm:text-base">
                  Salin Nomor Rekening
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-xl rounded-2xl">
              <CardContent className="p-6 sm:p-8 text-center">
                <div className="bg-green-100 rounded-full p-3 sm:p-4 w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4">
                  <Gift className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                </div>
                <h3 className="font-medium text-gray-800 mb-4 text-base sm:text-lg">QRIS</h3>
                <div className="bg-gray-100 p-4 rounded-lg mb-4">
                  <img src="/qr-code-payment.png" alt="QRIS Code" className="w-24 h-24 sm:w-32 sm:h-32 mx-auto" />
                </div>
                <Button className="bg-green-500 hover:bg-green-600 text-white text-sm sm:text-base">
                  Scan QR Code
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-20 px-4 bg-gradient-to-r from-rose-100 to-amber-100">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-12">
            <h2 className="font-serif text-2xl sm:text-3xl text-gray-800 mb-6 sm:mb-8">Terima Kasih</h2>
            <p className="text-gray-600 leading-relaxed mb-6 sm:mb-8 max-w-2xl mx-auto text-sm sm:text-base">
              Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk
              memberikan doa restu kepada kedua mempelai.
            </p>

            <div className="mb-6 sm:mb-8">
              <p className="text-base sm:text-lg text-gray-700 mb-2">Wassalamu'alaikum Wr. Wb.</p>
              <p className="text-gray-600 text-sm sm:text-base">Kami yang berbahagia,</p>
              <p className="font-serif text-xl sm:text-2xl text-gray-800 mt-4">Maulana & Nurul</p>
            </div>

            <div className="flex justify-center space-x-4">
              <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500" />
              <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
              <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-20 px-4 bg-gradient-to-r from-rose-50 to-amber-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-12">
            <h2 className="font-serif text-2xl sm:text-3xl text-gray-700 mb-2">Maulana & Nurul</h2>
            <p className="text-gray-600 text-base sm:text-lg">26 Juni 2026</p>
          </div>
        </div>
      </section>

      {isLightboxOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="relative max-w-4xl max-h-full w-full">
            <Button
              onClick={closeLightbox}
              className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 z-10"
            >
              <X className="w-4 h-4 sm:w-6 sm:h-6" />
            </Button>

            <img
              src={galleryImages[currentImageIndex] || "/placeholder.svg"}
              alt={`Gallery ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg"
            />

            <Button
              onClick={prevImage}
              className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 sm:p-3"
            >
              <span className="text-lg sm:text-xl">←</span>
            </Button>

            <Button
              onClick={nextImage}
              className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 sm:p-3"
            >
              <span className="text-lg sm:text-xl">→</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
