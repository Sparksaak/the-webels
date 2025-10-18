
'use client';

import { useState, useEffect } from "react";
import { format, formatDistanceToNow, parseISO } from "date-fns";

interface ClientTimeProps {
  timestamp: string;
  formatType: 'distance' | 'time' | 'date';
}

export function ClientTime({ timestamp, formatType }: ClientTimeProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Return a placeholder or null on the server
    return null;
  }

  try {
    const date = parseISO(timestamp);
    let formattedDate: string;

    switch (formatType) {
      case 'distance':
        formattedDate = formatDistanceToNow(date, { addSuffix: true });
        break;
      case 'time':
        formattedDate = format(date, 'p');
        break;
      case 'date':
        formattedDate = format(date, 'MMMM d, yyyy');
        break;
      default:
        formattedDate = date.toLocaleString();
    }
    return <>{formattedDate}</>;
  } catch (error) {
    // In case of an invalid timestamp, return null or a fallback
    console.error("Invalid timestamp provided to ClientTime:", timestamp, error);
    return null;
  }
}
