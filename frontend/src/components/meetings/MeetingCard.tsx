"use client";
import Link from "next/link";
import { MeetingListItem } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatDuration, MODULE_LABELS, MODULE_COLORS, STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";
import { Calendar, Clock, Building2, User, FolderKanban } from "lucide-react";

export function MeetingCard({ meeting }: { meeting: MeetingListItem }) {
  return (
    <Link href={`/meetings/${meeting.id}`}>
      <div className="bg-white rounded-xl border hover:border-brand-500 hover:shadow-md transition-all p-4 cursor-pointer">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{meeting.title}</h3>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge className={MODULE_COLORS[meeting.module]}>{MODULE_LABELS[meeting.module]}</Badge>
            <Badge className={STATUS_COLORS[meeting.status]}>{STATUS_LABELS[meeting.status]}</Badge>
          </div>
        </div>

        {meeting.summary && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">{meeting.summary}</p>
        )}

        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(meeting.date)}
          </span>
          {meeting.duration_seconds && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(meeting.duration_seconds)}
            </span>
          )}
          {meeting.project && (
            <span className="flex items-center gap-1">
              <FolderKanban className="w-3 h-3" />
              {meeting.project.name}
            </span>
          )}
          {meeting.company && (
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {meeting.company.name}
            </span>
          )}
          {meeting.persons && meeting.persons.length > 0 ? (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {meeting.persons.map(p => p.name).join(", ")}
            </span>
          ) : meeting.person && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {meeting.person.name}
            </span>
          )}
        </div>

        {meeting.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {meeting.tags.map(tag => (
              <span
                key={tag.id}
                className="px-2 py-0.5 rounded-full text-xs text-white"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}