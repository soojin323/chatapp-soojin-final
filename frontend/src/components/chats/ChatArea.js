import { useContext, useState, useRef, useEffect } from "react";
import { Stack } from "react-bootstrap";
import { AuthContext } from "../../context/AuthContext";
import { ChatContext } from "../../context/ChatContext";
import { useFetchRecipientUser } from "../../hooks/useFetchRecipient";
import moment from "moment";
import InputEmoji from "react-input-emoji";

const ChatArea = () => {
  const { user } = useContext(AuthContext);
  const {
    currentChat,
    messages,
    isMessageLoading,
    sendTextMessage,
    handleImageChange,
  } = useContext(ChatContext);
  const { recipientUser } = useFetchRecipientUser(currentChat, user);
  const [textMessage, setTextMessage] = useState("");
  const scroll = useRef();

  const renderMessageContent = (message) => {
    if (message.messageType === "image") {
      return (
        <img
          src={`data:image/jpeg;base64,${message.content}`}
          alt="Received Image"
        />
      );
    } else {
      return <span>{message.content}</span>;
    }
  };

  useEffect(() => {
    console.warn("messages", messages);
    scroll.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!user)
    return <p style={{ textAlign: "center", width: "100%" }}>Loading User</p>;

  if (!recipientUser)
    return (
      <p style={{ textAlign: "center", width: "100%" }}>
        No conversation selected
      </p>
    );
  if (isMessageLoading)
    return <p style={{ textAlign: "center", width: "100%" }}>Loading Chat</p>;

  return (
    <Stack gap={4} className="chat-box">
      <div className="chat-header">
        <strong>{recipientUser?.userName}</strong>
      </div>
      <Stack gap={3} className="messages">
        {messages &&
          messages.map((message, index) => (
            <Stack
              key={index}
              className={`${
                message?.senderId === user?._id
                  ? "message self align-self-end flex-grow-0"
                  : "message align-self-start flex-grow-0"
              }`}
              ref={scroll}
            >
              {renderMessageContent(message)}
              {/* <span>{message.content}</span> */}
              <span className="message-footer">
                {moment(message.createdAt).calendar()}
              </span>
            </Stack>
          ))}
      </Stack>
      <Stack className="chat-input flex-grow-0" direction="horizontal" gap={3}>
        <InputEmoji
          value={textMessage}
          onChange={setTextMessage}
          borderColor="rgba(72,112,223,0.2)"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleImageChange(e)}
        />
        <button
          className="send-btn"
          onClick={() =>
            sendTextMessage(
              textMessage,
              user,
              currentChat._id,
              setTextMessage,
              "text"
            )
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            className="bi bi-send"
            viewBox="0 0 16 16"
          >
            <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z" />
          </svg>
        </button>
      </Stack>
    </Stack>
  );
};

export default ChatArea;
