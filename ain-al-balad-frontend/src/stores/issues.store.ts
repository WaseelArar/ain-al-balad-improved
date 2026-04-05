import apiInstance from "$lib/api/api";
import { writable, get } from "svelte/store";

export interface Issue {
  issuesId: number;
  usersId: number;
  location: string;
  description: string;
  solved: boolean;
  date: string;
  image: string;
  username: string;
  privateIssue: boolean;
}

export interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface IssuesStoreState {
  items: Issue[];
  meta: Meta;
  loading: boolean;
  search: string;
  usersId: number | undefined;
  solved: boolean | undefined;
  privateIssue: boolean;
  error: string | null;
}

const DEFAULT_LIMIT = 30;

function createIssuesStore() {
  // Initial State
  const initialState: IssuesStoreState = {
    items: [],
    search: "",
    usersId: undefined,
    solved: undefined,
    privateIssue: false,
    meta: { total: 0, page: 1, limit: DEFAULT_LIMIT, totalPages: 0 },
    loading: false,
    error: null,
  };

  const { subscribe, update } = writable<IssuesStoreState>(initialState);

  // Track the current controller to cancel previous requests
  let abortController: AbortController | null = null;

  async function fetchIssues() {
    // Cancel any ongoing request before starting a new one
    if (abortController) abortController.abort();
    abortController = new AbortController();

    update((s) => ({ ...s, loading: true, error: null }));

    // Use the current state values for the query
    const state = get({ subscribe });
    const params = new URLSearchParams({
      page: state.meta.page.toString(),
      limit: state.meta.limit.toString(),
    });

    if (state.solved !== undefined)
      params.append("solved", state.solved ? "true" : "false");

    if (state.privateIssue === true) params.append("privateIssue", "true");

    if (state.usersId !== undefined)
      params.append("usersId", state.usersId.toString());

    if (state.search) params.append("search", state.search);

    try {
      const res = await apiInstance.get(`/issues?${params.toString()}`, {
        signal: abortController.signal,
      });

      update((s) => ({
        ...s,
        items: res.data.items,
        meta: res.data.meta,
        loading: false,
      }));
    } catch (err: any) {
      // Don't update state if the error was a manual cancellation
      if (err.name === "CanceledError" || err.name === "AbortError") return;

      update((s) => ({
        ...s,
        loading: false,
        error: err.response?.data?.message || err.message || "Network error",
      }));
    }
  }

  return {
    subscribe,

    /**
     * Sets category and resets page to 1
     */
    setSolved: (status?: boolean) => {
      update((s) => {
        if (s.solved === status) return s;
        return { ...s, solved: status, meta: { ...s.meta, page: 1 } };
      });
      fetchIssues();
    },

    setPrivate: (status: boolean) => {
      update((s) => {
        if (s.solved === status) return s;
        return { ...s, privateIssue: status, meta: { ...s.meta, page: 1 } };
      });
      fetchIssues();
    },
    setUsersId: (id?: number) => {
      update((s) => {
        // If the ID is the same, don't trigger a refresh
        if (s.usersId === id) return s;
        // Set the new ID and reset pagination to page 1
        return { ...s, usersId: id, meta: { ...s.meta, page: 1 } };
      });
      fetchIssues();
    },

    setSearch: (query: string = "") => {
      update((s) => {
        if (s.search === query) return s;
        return { ...s, search: query, meta: { ...s.meta, page: 1 } };
      });
      fetchIssues();
    },

    getById: (id: number): Issue | undefined => {
      if (!id) return;
      const state = get({ subscribe });
      return state.items.find((item) => item.issuesId === id);
    },

    nextPage: () => {
      let canPage = false;
      update((s) => {
        if (s.meta.page < s.meta.totalPages) {
          canPage = true;
          return { ...s, meta: { ...s.meta, page: s.meta.page + 1 } };
        }
        return s;
      });
      if (canPage) fetchIssues();
    },

    prevPage: () => {
      let canPage = false;
      update((s) => {
        if (s.meta.page > 1) {
          canPage = true;
          return { ...s, meta: { ...s.meta, page: s.meta.page - 1 } };
        }
        return s;
      });
      if (canPage) fetchIssues();
    },

    refresh: fetchIssues,
    reset: () => update(() => initialState),
  };
}

export const issueStore = createIssuesStore();
