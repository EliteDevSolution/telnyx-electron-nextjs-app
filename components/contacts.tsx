"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Phone, Search, User, Plus, Trash2, Edit } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Contact {
  id: string
  name: string
  phone_number: string
  email?: string | null
  notes?: string | null
}

interface ContactsProps {
  onCall: (number: string) => void
}

export default function Contacts({ onCall }: ContactsProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentContact, setCurrentContact] = useState<Contact | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    phone_number: "",
    email: "",
    notes: "",
  })
  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    if (user) {
      loadContacts()
    }
  }, [user])

  const loadContacts = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true })

      if (error) {
        throw error
      }

      setContacts(data || [])
    } catch (error) {
      console.error("Error loading contacts:", error)
      toast({
        title: "Error",
        description: "Failed to load contacts",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenDialog = (contact: Contact | null = null) => {
    if (contact) {
      setCurrentContact(contact)
      setFormData({
        name: contact.name,
        phone_number: contact.phone_number,
        email: contact.email || "",
        notes: contact.notes || "",
      })
    } else {
      setCurrentContact(null)
      setFormData({
        name: "",
        phone_number: "",
        email: "",
        notes: "",
      })
    }
    setIsDialogOpen(true)
  }

  const handleSaveContact = async () => {
    if (!user) return

    try {
      if (currentContact) {
        // Update existing contact
        const { error } = await supabase
          .from("contacts")
          .update({
            name: formData.name,
            phone_number: formData.phone_number,
            email: formData.email || null,
            notes: formData.notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentContact.id)

        if (error) throw error

        toast({
          title: "Contact Updated",
          description: `${formData.name} has been updated`,
        })
      } else {
        // Create new contact
        const { error } = await supabase.from("contacts").insert({
          user_id: user.id,
          name: formData.name,
          phone_number: formData.phone_number,
          email: formData.email || null,
          notes: formData.notes || null,
        })

        if (error) throw error

        toast({
          title: "Contact Added",
          description: `${formData.name} has been added to your contacts`,
        })
      }

      // Reload contacts
      await loadContacts()
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Error saving contact:", error)
      toast({
        title: "Error",
        description: "Failed to save contact",
        variant: "destructive",
      })
    }
  }

  const handleDeleteContact = async (id: string, name: string) => {
    if (!user) return

    try {
      const { error } = await supabase.from("contacts").delete().eq("id", id)

      if (error) throw error

      toast({
        title: "Contact Deleted",
        description: `${name} has been removed from your contacts`,
      })

      // Reload contacts
      await loadContacts()
    } catch (error) {
      console.error("Error deleting contact:", error)
      toast({
        title: "Error",
        description: "Failed to delete contact",
        variant: "destructive",
      })
    }
  }

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone_number.includes(searchQuery) ||
      (contact.email && contact.email.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button size="icon" onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : contacts.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
          <User className="h-12 w-12 mb-2 opacity-20" />
          <p>No contacts yet</p>
          <Button variant="link" onClick={() => handleOpenDialog()}>
            Add your first contact
          </Button>
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-muted-foreground">No contacts match your search</div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {filteredContacts.map((contact) => (
            <div key={contact.id} className="flex items-center justify-between p-3 border rounded-md">
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{contact.name}</div>
                <div className="text-sm text-muted-foreground">{contact.phone_number}</div>
                {contact.email && <div className="text-xs text-muted-foreground truncate">{contact.email}</div>}
              </div>
              <div className="flex space-x-2 ml-2">
                <Button variant="outline" size="icon" onClick={() => handleOpenDialog(contact)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => onCall(contact.phone_number)}>
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => handleDeleteContact(contact.id, contact.name)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentContact ? "Edit Contact" : "Add Contact"}</DialogTitle>
            <DialogDescription>
              {currentContact ? "Update the contact information below" : "Fill in the details to add a new contact"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contact name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="+1234567890"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add notes about this contact"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveContact} disabled={!formData.name || !formData.phone_number}>
              {currentContact ? "Update" : "Add"} Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
