import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "../components/ui/button"
import { Checkbox } from "../components/ui/checkbox"
import { fetchApplications, fetchGroupApplications, updateGroupApplications } from "../services/api"
import { Shield, Layers } from "lucide-react"

export default function AppAccessModal({ open, onClose, group }: any) {
  const [allApps, setAllApps] = useState<any[]>([])
  const [selectedApps, setSelectedApps] = useState<string[]>([])
  const isAdminGroup = group?.name === "Admins"

  useEffect(() => {
    if (!open || !group?._id) return

    Promise.all([
      fetchApplications(),
      fetchGroupApplications(group._id),
    ]).then(([appsRes, assignedRes]) => {
      setAllApps(appsRes.data || [])
      setSelectedApps(assignedRes.data?.map((a: any) => a._id) || [])
    })
  }, [open, group])

  const toggleApp = (appId: string) => {
    setSelectedApps((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    )
  }

  const handleSave = async () => {
    await updateGroupApplications(group._id, selectedApps)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
            <Layers className="h-5 w-5 text-red-600" />
            Application Access
          </DialogTitle>
          <DialogDescription className="font-medium text-gray-600">
            Manage application access for "{group?.name}"
          </DialogDescription>
        </DialogHeader>

        {isAdminGroup ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-red-600">
              <Shield className="h-4 w-4" />
              <span className="font-medium">Administrator Group</span>
            </div>
            <p className="text-sm text-red-600 mt-1">
              Admin users have access to all applications and management features by default.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex gap-2 items-center">
              <Layers className="h-4 w-4 text-gray-500" />
              Available Applications
            </h3>
            <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-xl p-4">
              {allApps.map((app) => (
                <div key={app._id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`access-${app._id}`}
                    checked={selectedApps.includes(app._id)}
                    onCheckedChange={() => toggleApp(app._id)}
                  />
                  <label
                    htmlFor={`access-${app._id}`}
                    className="text-sm font-medium leading-none flex items-center gap-2"
                  >
                    {app.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="pt-6">
          <Button variant="outline" onClick={onClose} className="rounded-xl font-medium">
            Cancel
          </Button>
          {!isAdminGroup && (
            <Button onClick={handleSave} className="bg-red-600 hover:bg-red-700 rounded-xl font-semibold">
              Save Access
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
