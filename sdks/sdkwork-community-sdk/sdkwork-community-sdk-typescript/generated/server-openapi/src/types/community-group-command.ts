import type { CommunityGroupQr } from './community-group-qr';

export interface CommunityGroupCommand {
  name: string;
  platform: string;
  description?: string;
  memberCount?: string;
  qrCodes?: CommunityGroupQr[];
}
