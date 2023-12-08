import { Stack } from "react-bootstrap";
import React, { useContext } from "react";
import styled from "styled-components";
import { useFetchRecipientUser } from "../../hooks/useFetchRecipient";
import { ChatContext } from "../../context/ChatContext";
import { unreadNotificationsFunc } from "../../utils/unreadNotifications";
import { useFetchLatestMessage } from "../../hooks/useFetchLatestMessage";
import moment from "moment";

const UserList = ({ index, chat, user, query }) => {
    const { recipientUser } = useFetchRecipientUser(chat, user, query);
    // console.warn("recipientUser", recipientUser);
    const { onlineUsers, notifications, markThisUserNotificationsAsRead } =
        useContext(ChatContext);
    const { updateCurrentChat } = useContext(ChatContext);

    const { latestMessage } = useFetchLatestMessage(chat);
    const unreadNotifications = unreadNotificationsFunc(notifications);
    const thisUserNotifications = unreadNotifications?.filter(
        (n) => n.senderId === recipientUser?._id
    );
    const isOnline = onlineUsers?.some(
        (user) => user?.userId === recipientUser?._id
    );
    const profilePictureUrl =
        recipientUser && recipientUser.profilePicture
            ? `http://localhost:8080/${recipientUser.profilePicture}`
            : "";

    const truncateText = (text) => {
        let shortText = text.substring(0, 20);

        if (text.length > 20) {
            shortText = shortText + "...";
        }
        return shortText;
    };

    // console.log("recipientUser", recipientUser);
    return recipientUser ? (
        <div key={index} onClick={() => updateCurrentChat(chat)}>
            <Stack
                direction="horizontal"
                gap={3}
                className="user-card align-items-center p-2 justify-content-between"
                role="button"
                onClick={() => {
                    if (thisUserNotifications?.length !== 0) {
                        markThisUserNotificationsAsRead(
                            thisUserNotifications,
                            notifications
                        );
                    }
                }}
            >
                <div className="d-flex">
                    <div className="me-2">
                        {profilePictureUrl ? (
                            <UserAvatar src={profilePictureUrl} />
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="40px"
                                height="40px"
                                fill="currentColor"
                                className="user-svg bi bi-person-circle"
                                viewBox="0 0 16 16"
                            >
                                <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0" />
                                <path
                                    fill-rule="evenodd"
                                    d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1"
                                />
                            </svg>
                        )}
                    </div>
                    <div className="text-content">
                        <div className="name">{recipientUser.userName}</div>
                        <div className="text">
                            {!latestMessage?.fileName &&
                                latestMessage?.content && (
                                    <span>
                                        {truncateText(latestMessage?.content)}
                                    </span>
                                )}
                            {latestMessage?.fileName && (
                                <span>{latestMessage?.fileName}</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="d-flex flex-column align-items-end">
                    <div className="date">
                        {moment(latestMessage?.updatedAt).calendar()}
                    </div>
                    <div
                        className={
                            thisUserNotifications?.length > 0
                                ? "this-user-notifications"
                                : ""
                        }
                    >
                        {thisUserNotifications?.length > 0
                            ? thisUserNotifications?.length
                            : ""}
                    </div>
                    {/* <span className={isOnline ? "user-online" : ""}></span> */}
                    <span
                        className={
                            recipientUser.showStatus === true
                                ? "user-online"
                                : ""
                        }
                    ></span>
                </div>
            </Stack>
        </div>
    ) : null;
};

const UserAvatar = styled.div`
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: purple;
    margin-right: 15px;
    background-image: url(${(props) => props.src});
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
`;

export default UserList;
