import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { NotificationList } from './NotificationList';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface UnreadCountResponse {
  unread_count: number;
}

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Fetch unread count
  const { data: unreadData, refetch: refetchCount } = useQuery<UnreadCountResponse>({
    queryKey: ['notificationCount'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const unreadCount = unreadData?.unread_count || 0;

  // Refetch count when popover closes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      refetchCount(); // Refresh count when closing
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <NotificationList onNotificationRead={refetchCount} />
      </PopoverContent>
    </Popover>
  );
};
