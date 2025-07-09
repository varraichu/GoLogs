// File: src/pages/components/LogFilters.tsx
import { h } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import 'ojs/ojselectcombobox'
import 'ojs/ojdatetimepicker'
import 'ojs/ojbutton'

import { useToast } from '../../../context/ToastContext'
import Toast from '../../../components/Toast'

import applicationsService, {
  Application,
  UserGroup,
} from '../../../services/applications.services'
import ArrayDataProvider = require('ojs/ojarraydataprovider')

interface LogExportsProps {
  setExportDialog: ()=>void
}

const LogExports = ({setExportDialog}:LogExportsProps) => {

  return (
    <oj-c-button
      class="oj-sm-padding-4x-end"
      label="Export Logs"
      chroming="danger"
      onojAction={setExportDialog}
    >
      <span slot="startIcon" class="oj-ux-ico-download"></span>
    </oj-c-button>
  )
}

export default LogExports
