import { h } from 'preact'
import { useState } from 'preact/hooks'
import 'ojs/ojavatar'
import { ColorPaletteIntrinsicProps } from 'ojs/ojcolorpalette'
import * as Color from 'ojs/ojcolor'

interface UserProfileColorPaletteProps {
  pictureUrl?: string
  username?: string
  isAdmin?: boolean
}

const ojJetSwatches: string[][] = [
  // [Color.ALICEBLUE, Color.ANTIQUEWHITE, Color.BLACK],
  ['#d5192c', '#ffb300', '#4f8400'],
]

export function UserProfileColorPalette({
  pictureUrl,
  username,
  isAdmin,
}: UserProfileColorPaletteProps) {
  const [selectedColor, setSelectedColor] = useState<Color | undefined>(undefined)

  return (
    <oj-color-palette
      value={selectedColor}
      // swatches={ojJetSwatches}
      onvalueChanged={(e) => setSelectedColor(e.detail.value)}
    >
      <div slot="start" class="oj-flex oj-sm-flex-direction-column">
        <div class="oj-flex oj-align-items-center oj-md-padding-4x">
          <oj-avatar
            size="sm"
            class="oj-sm-margin-end-5x oj-sm-padding-2x"
            src={pictureUrl || undefined}
            initials={!pictureUrl && username ? username[0] : undefined}
            slot="leading"
          ></oj-avatar>
          <div class="oj-sm-padding-2x">
            <div class="oj-typography-body-md oj-text-color-primary">{username?.split(' ')[0]}</div>
            <div class="oj-typography-body-md oj-text-color-primary">{username?.split(' ')[1]}</div>
            <div class="oj-typography-subbody-sm oj-text-color-secondary">
              {isAdmin ? 'Admin' : 'User'}
            </div>
          </div>
        </div>
        <li class="oj-navigationlist-category-divider"></li>
      </div>
    </oj-color-palette>
  )
}
