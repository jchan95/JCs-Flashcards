import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getGuestId, isGuestId } from "./guest";

// Get headers including guest ID if needed
function getHeaders(includeContentType: boolean = false): HeadersInit {
  const headers: HeadersInit = {};
  
  // Add guest ID header if in guest mode
  const guestId = localStorage.getItem("jc_flashcards_guest_id");
  if (guestId) {
    headers["X-Guest-Id"] = guestId;
  }
  
  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }
  
  return headers;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: getHeaders(!!data),
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Handle query keys - use first element as full URL if it starts with /
    let url: string;
    if (typeof queryKey[0] === "string" && queryKey[0].startsWith("/")) {
      // If the first key element is already a full path, use it directly
      url = queryKey[0];
    } else {
      // Otherwise join segments (for backwards compatibility)
      url = queryKey.filter(k => k !== undefined && k !== null).join("/");
    }
    
    const res = await fetch(url, {
      credentials: "include",
      headers: getHeaders(),
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
