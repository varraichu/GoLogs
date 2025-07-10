// File: src/pages/components/LogFilters.tsx
import { h } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import 'ojs/ojselectcombobox'
import 'ojs/ojdatetimepicker'
import 'ojs/ojbutton'
import "oj-c/progress-button"
// import "./LogExports.css"

import { useToast } from '../../../context/ToastContext'
import Toast from '../../../components/Toast'

import applicationsService, {
  Application,
  UserGroup,
} from '../../../services/applications.services'
import ArrayDataProvider = require('ojs/ojarraydataprovider')

interface LogExportsProps {
  setExportDialog: ()=>void
  isLoading : boolean
}

const LogExports = ({setExportDialog,isLoading}:LogExportsProps) => {

  return (
    <oj-c-progress-button
      class="oj-sm-padding-4x-end"
      label="Export Logs"
      chroming="callToAction"
      onojAction={setExportDialog}
      isLoading = {isLoading}
      // style="bg:red !important"
    >
      <span slot="startIcon" class="oj-ux-ico-download"></span>
    </oj-c-progress-button>
  )
}

export default LogExports
