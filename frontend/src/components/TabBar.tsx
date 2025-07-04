// File: src/components/TabBarWrapper.tsx
import { h } from 'preact'
import 'oj-c/tab-bar'
import { TabData } from 'oj-c/tab-bar'

interface TabBarProps {
    // data: TabData<string>[]
    selectedItem: string
    onSelectionChange: (event: CustomEvent) => void
}

export const TabBar = ({selectedItem, onSelectionChange }: TabBarProps) => {
    const data: TabData<string>[] = [
        { label: 'Active', itemKey: 'active' },
        { label: 'Inactive', itemKey: 'inactive' },
    ]
    return (
        <div>
            <oj-c-tab-bar
                data={data}
                selection={selectedItem}
                onojSelectionAction={onSelectionChange}
                edge="top"
                layout="condense"
                display="standard"
                aria-label="Basic TabBar"
            />
        </div>
    )
}