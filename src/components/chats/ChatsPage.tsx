import React, { FC } from "react";
import GlassAppLayout from "../layout/GlassAppLayout";
import ChatsWorkspace from "./ChatsWorkspace";

export const ChatsPage: FC = () => {
  return (
    <GlassAppLayout
      currentRoute="chats"
      activeBreadcrumb={{ section: "Communication", page: "Chat" }}
    >
      <ChatsWorkspace initialChannel="sms" />
    </GlassAppLayout>
  );
};

export default ChatsPage;
