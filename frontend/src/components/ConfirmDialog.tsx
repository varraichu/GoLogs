// File: src/components/ConfirmDialog.tsx
import { h } from 'preact'
import { ComponentChildren } from 'preact'
import 'ojs/ojbutton'
import 'ojs/ojdialog'

interface ConfirmDialogProps {
  title: string
  message?: string
  confirmText: string
  cancelText: string
  onConfirm: () => void
  onCancel: () => void
  confirmType?: 'danger' | 'callToAction' | 'borderless'
  cancelType?: 'danger' | 'callToAction' | 'borderless'
  children?: ComponentChildren // <- new
}

export const ConfirmDialog = ({
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  confirmType = 'danger',
  cancelType = 'borderless',
  children,
}: ConfirmDialogProps) => {
  return (
    <oj-dialog id="confirmDialog" dialogTitle={title} initialVisibility="show">
      <div class="oj-dialog-body">
        {message && <p>{message}</p>}
        {children}
      </div>
      <div class="oj-dialog-footer">
        <oj-button onojAction={onConfirm} chroming={confirmType}>
          {confirmText}
        </oj-button>
        <oj-button onojAction={onCancel} chroming={cancelType}>
          {cancelText}
        </oj-button>
      </div>
    </oj-dialog>
  )
}
