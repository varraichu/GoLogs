// File: src/pages/components/LogFilters.tsx
import { h } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import "oj-c/select-single"
import "ojs/ojoption"
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
import MutableArrayDataProvider = require('ojs/ojmutablearraydataprovider')

interface LogExportsDialogProps {
  close: ()=>void;
  export: ()=>void;
  opened: boolean;
  exportFormat : "csv"|"txt";
  setExportFormat : (str:"csv"|"txt")=>void;
}

const exportOptions = [
  { value: "csv", label: "CSV" },
  { value: "txt", label: "Text" }
];

const optionsDP = new ArrayDataProvider(exportOptions, {
  keyAttributes: "value"
});


const LogExportsDialog = ({  close, export:exp,opened,exportFormat,setExportFormat }: LogExportsDialogProps) => {
  
  return (
    <div>
      <oj-c-dialog
        opened={opened}
        // headerDecoration='off'
        // cancelBehavior="icon"
        // onojCancel={onCancel}
        // style="--oj-dialog-width: 600px; --oj-dialog-max-height: 80vh;"
      >
        <div slot="header">
          {/* header */}
          <h2 class="oj-flex-item oj-flex ">
            <span class="oj-ux-ico-download oj-text-color-danger oj-typography-heading-sm oj-sm-padding-4x-end"></span>
            <span class="oj-typography-heading-sm">Export Logs</span>
          </h2>
          <span class="oj-typography-subheading-xs oj-text-color-secondary">
            Select the file format for your log export
          </span>
          {/* <h3 class="oj-flex-item oj-flex ">
            <span class="oj-typography-subheading-xs oj-text-color-secondary">Select the file format for your log export</span>
          </h3> */}
        </div>

        <div slot="body">
          <div class="oj-flex oj-sm-flex-direction-column">
            <div>Export Format</div>
            <oj-c-select-single
              label-hint="Export Format"
              value={exportFormat}
              data={optionsDP}
              onvalueChanged={(event) => setExportFormat(event.detail.value)}
              itemText={(item) => item.data.label}
            />
          </div>
        </div>
        <div slot="footer">
          <oj-button chroming="borderless" class="oj-sm-padding-4x-end" onojAction={close}>
            Cancel
          </oj-button>
          <oj-button chroming="danger" class="oj-sm-padding-4x-start" onojAction={exp} >
            Export
          </oj-button>
        </div>
      </oj-c-dialog>
    </div>
  )
}

export default LogExportsDialog
