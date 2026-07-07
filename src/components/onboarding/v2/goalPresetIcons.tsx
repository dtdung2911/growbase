import type { ReactNode } from "react"
import ShieldDuotoneIcon from "@iconify-react/stash/shield-duotone";
import GraduationCapDuotoneIcon from "@iconify-react/stash/graduation-cap-duotone";
import HouseLineDuotoneIcon from "@iconify-react/ph/house-line-duotone";
import IslandDuotoneIcon from "@iconify-react/ph/island-duotone";
import PencilSimpleLineDuotoneIcon from "@iconify-react/ph/pencil-simple-line-duotone";

const iconColor = { color: "var(--primary-color)" }

export const GOAL_PRESET_ICONS: Record<string, ReactNode> = {
  emergency: <ShieldDuotoneIcon height="1.6em" style={iconColor} />,
  education: <GraduationCapDuotoneIcon height="1.8em" style={iconColor} />,
  house: <HouseLineDuotoneIcon height="1.5em" style={iconColor} />,
  travel: <IslandDuotoneIcon height="1.8em" style={iconColor} />,
  custom: <PencilSimpleLineDuotoneIcon height="1.3em" style={iconColor} />,
}
