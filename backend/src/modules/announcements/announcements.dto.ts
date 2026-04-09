import { Announcement } from './announcements.model';

export function toAnnouncementDTO(announcement: Announcement) {
  return {
    id: announcement.id,
    communityId: announcement.communityId,
    title: announcement.title,
    body: announcement.body,
    priority: announcement.priority,
    publishAt: announcement.publishAt,
    expiresAt: announcement.expiresAt,
    author: announcement.author ? { id: announcement.author.id, firstName: announcement.author.firstName, lastName: announcement.author.lastName } : null,
    createdAt: announcement.createdAt,
    updatedAt: announcement.updatedAt,
  };
}

export function toAnnouncementListDTO(announcements: Announcement[]) {
  return announcements.map(toAnnouncementDTO);
}
