export interface CommunityCategoryCommand {
  slug: string;
  title: string;
  description?: string;
  priority?: number;
  enabled?: boolean;
}
