"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Heart, Copy, Eye, Link2, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"

interface GeneratedLink {
  id: number
  guest_name: string
  link: string
  created_at: string
}

export default function GuestGenerator() {
  const [guestName, setGuestName] = useState("")
  const [generatedLinks, setGeneratedLinks] = useState<GeneratedLink[]>([])
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    loadGuestInvitations()

    // Setup real-time subscription
    const channel = supabase
      .channel("guest_invitations_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "guest_invitations" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setGeneratedLinks((prev) => [payload.new as GeneratedLink, ...prev])
        } else if (payload.eventType === "DELETE") {
          setGeneratedLinks((prev) => prev.filter((link) => link.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadGuestInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from("guest_invitations")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading guest invitations:", error)
        return
      }

      setGeneratedLinks(data || [])
    } catch (error) {
      console.error("Error loading guest invitations:", error)
    }
  }

  const generateLink = async () => {
    if (!guestName.trim()) {
      alert("Mohon masukkan nama tamu terlebih dahulu")
      return
    }

    setIsLoading(true)
    try {
      const encodedName = encodeURIComponent(guestName.trim())
      const newLink = `${window.location.origin}?guest=${encodedName}`

      const { error } = await supabase.from("guest_invitations").insert([
        {
          guest_name: guestName.trim(),
          link: newLink,
        },
      ])

      if (error) {
        console.error("Error saving guest invitation:", error)
        alert("Terjadi kesalahan saat menyimpan undangan. Silakan coba lagi.")
        return
      }

      setGuestName("")
    } catch (error) {
      console.error("Error generating link:", error)
      alert("Terjadi kesalahan saat membuat link. Silakan coba lagi.")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (link: string, id: number) => {
    try {
      await navigator.clipboard.writeText(link)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error("Failed to copy: ", err)
      alert("Gagal menyalin link")
    }
  }

  const deleteLink = async (id: number) => {
    try {
      const { error } = await supabase.from("guest_invitations").delete().eq("id", id)

      if (error) {
        console.error("Error deleting guest invitation:", error)
        alert("Terjadi kesalahan saat menghapus undangan. Silakan coba lagi.")
      }
    } catch (error) {
      console.error("Error deleting link:", error)
      alert("Terjadi kesalahan saat menghapus link. Silakan coba lagi.")
    }
  }

  const previewTemplate = () => {
    router.push("/")
  }

  const clearAllLinks = async () => {
    if (confirm("Apakah Anda yakin ingin menghapus semua link yang dibuat?")) {
      try {
        const { error } = await supabase.from("guest_invitations").delete().neq("id", 0) // Delete all records

        if (error) {
          console.error("Error clearing all links:", error)
          alert("Terjadi kesalahan saat menghapus semua link. Silakan coba lagi.")
        }
      } catch (error) {
        console.error("Error clearing all links:", error)
        alert("Terjadi kesalahan saat menghapus semua link. Silakan coba lagi.")
      }
    }
  }

  const clearAllMessages = async () => {
    if (confirm("Apakah Anda yakin ingin menghapus semua pesan dan konfirmasi kehadiran?")) {
      try {
        const { error } = await supabase
          .from("rsvp_messages")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000")

        if (error) {
          console.error("Error clearing all messages:", error)
          alert("Terjadi kesalahan saat menghapus semua pesan. Silakan coba lagi.")
        } else {
          alert("Semua pesan dan konfirmasi kehadiran telah dihapus!")
        }
      } catch (error) {
        console.error("Error clearing all messages:", error)
        alert("Terjadi kesalahan saat menghapus semua pesan. Silakan coba lagi.")
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-25 to-amber-25 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
            <Heart className="w-16 h-16 text-rose-400 mx-auto mb-4 float-animation" />
            <h1 className="font-serif text-4xl text-gray-800 mb-2">Maulana & Nurul</h1>
            <p className="text-gray-600 text-lg mb-4">26 Juni 2026</p>
            <div className="w-32 h-0.5 bg-gradient-to-r from-rose-300 to-amber-300 mx-auto mb-4"></div>
            <h2 className="font-serif text-2xl text-gray-700 mb-2">Generator Undangan</h2>
            <p className="text-gray-600 text-lg">
              Buat undangan personal untuk setiap tamu dengan nama yang dipersonalisasi
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Generator Form */}
          <Card className="bg-white shadow-xl rounded-2xl">
            <CardContent className="p-8">
              <h2 className="font-serif text-2xl text-gray-800 mb-6 text-center">Buat Undangan Personal</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Nama Tamu</label>
                  <Input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Masukkan nama tamu (contoh: Bapak/Ibu Sari)"
                    className="w-full text-lg"
                    onKeyPress={(e) => e.key === "Enter" && !isLoading && generateLink()}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={generateLink}
                    className="w-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white py-3 text-lg font-medium"
                    disabled={!guestName.trim() || isLoading}
                  >
                    <Link2 className="w-5 h-5 mr-2" />
                    {isLoading ? "Membuat Link..." : "Generate Link Undangan"}
                  </Button>

                  <Button
                    onClick={previewTemplate}
                    variant="outline"
                    className="w-full border-2 border-rose-300 text-rose-600 hover:bg-rose-50 py-3 text-lg font-medium bg-transparent"
                  >
                    <Eye className="w-5 h-5 mr-2" />
                    Lihat Template Undangan
                  </Button>
                </div>
              </div>

              {/* Messages Section */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="font-serif text-xl text-gray-800 mb-4 text-center">Pesan & Konfirmasi</h3>
                <p className="text-center text-gray-600 text-sm mb-4">
                  Kelola semua pesan dan konfirmasi kehadiran dari tamu undangan
                </p>
              </div>

              {/* Statistics */}
              {generatedLinks.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="bg-gradient-to-r from-rose-50 to-amber-50 p-4 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-rose-600">{generatedLinks.length}</div>
                      <div className="text-sm text-gray-600 mb-3">Link Undangan Dibuat</div>
                      <div className="space-y-2">
                        <Button
                          onClick={clearAllLinks}
                          variant="outline"
                          size="sm"
                          className="w-full text-red-500 border-red-300 hover:bg-red-50 bg-transparent"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Hapus Semua Link
                        </Button>
                        <Button
                          onClick={clearAllMessages}
                          variant="outline"
                          size="sm"
                          className="w-full text-orange-500 border-orange-300 hover:bg-orange-50 bg-transparent"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Hapus Semua Pesan & Konfirmasi
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Generated Links */}
          <Card className="bg-white shadow-xl rounded-2xl">
            <CardContent className="p-8">
              <h2 className="font-serif text-2xl text-gray-800 mb-6 text-center">Link Undangan yang Dibuat</h2>

              {generatedLinks.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">Belum ada link yang dibuat</p>
                  <p className="text-sm">Masukkan nama tamu dan klik generate untuk membuat link undangan</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {generatedLinks.map((linkData) => (
                    <div
                      key={linkData.id}
                      className="bg-gradient-to-r from-rose-50 to-amber-50 p-5 rounded-xl border border-rose-100 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-800 text-lg">{linkData.guest_name}</h3>
                          <p className="text-xs text-gray-500">
                            Dibuat: {new Date(linkData.created_at).toLocaleString("id-ID")}
                          </p>
                        </div>
                        <Button
                          onClick={() => deleteLink(linkData.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="bg-white/70 p-3 rounded-lg mb-3">
                        <p className="text-sm text-gray-600 break-all font-mono">{linkData.link}</p>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          onClick={() => copyToClipboard(linkData.link, linkData.id)}
                          className={`flex-1 ${
                            copiedId === linkData.id
                              ? "bg-green-500 hover:bg-green-600"
                              : "bg-blue-500 hover:bg-blue-600"
                          } text-white`}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          {copiedId === linkData.id ? "Tersalin!" : "Salin Link"}
                        </Button>
                        <Button
                          onClick={() => window.open(linkData.link, "_blank")}
                          variant="outline"
                          className="border-rose-300 text-rose-600 hover:bg-rose-50"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="bg-white shadow-xl rounded-2xl mt-8">
          <CardContent className="p-8">
            <h3 className="font-serif text-xl text-gray-800 mb-4 text-center">Cara Menggunakan Generator</h3>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="space-y-3">
                <div className="bg-rose-100 rounded-full p-4 w-16 h-16 mx-auto">
                  <span className="text-2xl font-bold text-rose-600">1</span>
                </div>
                <h4 className="font-medium text-gray-800">Masukkan Nama</h4>
                <p className="text-sm text-gray-600">
                  Ketik nama tamu yang akan menerima undangan (contoh: "Bapak/Ibu Sari")
                </p>
              </div>
              <div className="space-y-3">
                <div className="bg-amber-100 rounded-full p-4 w-16 h-16 mx-auto">
                  <span className="text-2xl font-bold text-amber-600">2</span>
                </div>
                <h4 className="font-medium text-gray-800">Generate Link</h4>
                <p className="text-sm text-gray-600">
                  Klik tombol generate untuk membuat link undangan yang dipersonalisasi
                </p>
              </div>
              <div className="space-y-3">
                <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto">
                  <span className="text-2xl font-bold text-green-600">3</span>
                </div>
                <h4 className="font-medium text-gray-800">Bagikan Link</h4>
                <p className="text-sm text-gray-600">
                  Salin dan bagikan link kepada tamu. Nama mereka akan muncul di undangan
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
