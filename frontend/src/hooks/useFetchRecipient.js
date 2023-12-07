import { useEffect, useState } from "react";
import { baseUrl, getRequest } from "../utils/services";

export const useFetchRecipientUser = (chat, user, query) => {
  const [recipientUser, setRecipientUser] = useState(null);
  const [error, setError] = useState(null);

  const recipientId = chat?.roomMembers?.find((id) => id !== user?._id);

  useEffect(() => {
    const getUser = async () => {
      if (!recipientId) {
        console.log("No recipient ID found");
        setRecipientUser();
        return null;
      }

      try {
        const response = await getRequest(
          `${baseUrl}/users/find/${recipientId}`
        );

        const filteredUser = query
          ? response?.userName?.toLowerCase().includes(query.toLowerCase())
          : response;

        setRecipientUser(filteredUser ? response : null);
        console.log("Fetched user data:", response);
      } catch (error) {
        console.error("Error fetching user:", error);
        setError(error);
      }
    };

    getUser();
  }, [recipientId, query]);

  return { recipientUser, error };
};
