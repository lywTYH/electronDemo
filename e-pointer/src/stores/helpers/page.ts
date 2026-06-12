import { SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH } from './constants';

export const constrainSidebarWidth = (width: number): number =>
  Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, width));
