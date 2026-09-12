import React, { FC } from "react";
import { MessageSquare, DollarSign, Radio, UserCheck, Smartphone } from "lucide-react";
import { ChatChannelType } from "../../api/chatsApi";

interface ChatChannelSelectorProps {
  activeChannel: ChatChannelType;
  onSelectChannel: (channel: ChatChannelType) => void;
  unreadCounts?: Partial<Record<ChatChannelType, number>>;
}

interface ChannelOption {
  id: ChatChannelType;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  description: string;
}

export const CHANNELS: ChannelOption[] = [
  {
    id: "sms",
    label: "SMS Chat",
    shortLabel: "SMS",
    icon: <MessageSquare size={14} />,
    description: "Twilio 3rd-Party Driver SMS Line",
  },
  {
    id: "payroll",
    label: "Payroll Chat",
    shortLabel: "Payroll",
    icon: <DollarSign size={14} />,
    description: "Dedicated Driver Payroll Support Queue",
  },
  {
    id: "short_code",
    label: "DSP Short Code (Many:1)",
    shortLabel: "DSP Code",
    icon: <Radio size={14} />,
    description: "In-App Company Team Dispatch Chat",
  },
  {
    id: "direct",
    label: "Direct Messages (1:1)",
    shortLabel: "1:1 Direct",
    icon: <UserCheck size={14} />,
    description: "Personal 1-on-1 WhatsApp-style chat",
  },
  {
    id: "secondary_sms",
    label: "Secondary SMS",
    shortLabel: "SMS 2",
    icon: <Smartphone size={14} />,
    description: "Secondary Twilio Line / Custom Campaign",
  },
];

export const ChatChannelSelector: FC<ChatChannelSelectorProps> = ({
  activeChannel,
  onSelectChannel,
  unreadCounts = {},
}) => {
  return (
    <div className="chat-channel-switcher" role="tablist" aria-label="Chat Channels">
      {CHANNELS.map((ch) => {
        const isActive = activeChannel === ch.id;
        const unread = unreadCounts[ch.id] || 0;

        return (
          <button
            key={ch.id}
            role="tab"
            aria-selected={isActive}
            className={`chat-channel-btn ${isActive ? "active" : ""}`}
            onClick={() => onSelectChannel(ch.id)}
            title={`${ch.label} - ${ch.description}`}
          >
            {ch.icon}
            <span>{ch.label}</span>
            {unread > 0 && (
              <span className="chat-channel-badge" title={`${unread} unread`}>
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ChatChannelSelector;
