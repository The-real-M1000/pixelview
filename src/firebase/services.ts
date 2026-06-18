import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc
} from "firebase/firestore";
import { db } from "./config";

// --- Types ---
export interface Comment {
  id: string;
  mediaId: string;
  mediaType: "movie" | "series" | "anime";
  userId: string;
  username: string;
  userPhoto: string;
  content: string;
  parentId: string | null;
  createdAt: any;
  pendingReview?: boolean;
}

export interface PlaylistItem {
  mediaId: string;
  mediaType: "movie" | "series" | "anime";
  title: string;
  poster: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  userId: string;
  isPublic: boolean;
  items: PlaylistItem[];
  createdAt: any;
}

export interface HistoryItem {
  id: string;
  userId: string;
  mediaId: string;
  mediaType: "movie" | "series" | "anime";
  title: string;
  poster: string;
  season: number | null;
  episode: number | null;
  progress: number; // percentage (0 to 100) or watch duration
  updatedAt: any;
}

export interface Report {
  id: string;
  reporterId: string;
  targetType: "comment" | "user" | "media";
  targetId: string;
  targetName: string; // Title or Username
  reason: "spam" | "inappropriate" | "copyright" | "violence" | "other";
  details: string;
  status: "pending" | "resolved" | "dismissed";
  autoDetected: boolean;
  createdAt: any;
}

// --- List of Offensive Words and Spam Patterns ---
const OFFENSIVE_WORDS = [
  "puto", "puta", "mierda", "pendejo", "cabron", "cabrón", "jodete", "jódete", "maricon", "maricón", "culero", "gonorrea", "hp"
];

const SPAM_PATTERNS = [
  /https?:\/\/[^\s]+/gi, // Any http/https link
  /www\.[^\s]+/gi,       // Any www link
  /free-flix/gi,
  /gana dinero/gi,
  /cripto/gi,
  /bitcoin/gi
];

// Moderation Utility
export function checkModeration(text: string): { isViolating: boolean; reason: string } {
  const lowerText = text.toLowerCase();
  
  // 1. Check offensive words
  for (const word of OFFENSIVE_WORDS) {
    if (lowerText.includes(word)) {
      return { isViolating: true, reason: `Palabra ofensiva detectada: "${word}"` };
    }
  }

  // 2. Check spam patterns
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(lowerText)) {
      return { isViolating: true, reason: "Enlace o patrón de spam sospechoso detectado" };
    }
  }

  return { isViolating: false, reason: "" };
}

// --- Database Services ---
export const dbServices = {
  // LIKES
  async toggleLike(userId: string, mediaId: string, mediaType: "movie" | "series" | "anime", title: string, poster: string) {
    const likeDocId = `${userId}_${mediaId}`;
    const docRef = doc(db, "likes", likeDocId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      await deleteDoc(docRef);
      return false; // unliked
    } else {
      await setDoc(docRef, {
        userId,
        mediaId,
        mediaType,
        title,
        poster,
        createdAt: new Date().toISOString()
      });
      return true; // liked
    }
  },

  async isLiked(userId: string, mediaId: string): Promise<boolean> {
    const likeDocId = `${userId}_${mediaId}`;
    const docRef = doc(db, "likes", likeDocId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  },

  async getMostLikedMediaIds(mediaType?: string): Promise<Array<{ mediaId: string; count: number }>> {
    let q = collection(db, "likes");
    const snapshot = await getDocs(q);
    
    const counts: Record<string, { count: number; type: string }> = {};
    snapshot.forEach(docData => {
      const data = docData.data();
      if (!mediaType || data.mediaType === mediaType) {
        const id = String(data.mediaId);
        if (!counts[id]) {
          counts[id] = { count: 0, type: data.mediaType };
        }
        counts[id].count += 1;
      }
    });

    return Object.entries(counts)
      .map(([mediaId, val]) => ({ mediaId, count: val.count }))
      .sort((a, b) => b.count - a.count);
  },

  // FAVORITES
  async toggleFavorite(userId: string, mediaId: string, mediaType: "movie" | "series" | "anime", title: string, poster: string) {
    const favDocId = `${userId}_${mediaId}`;
    const docRef = doc(db, "favorites", favDocId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      await deleteDoc(docRef);
      return false; // removed
    } else {
      await setDoc(docRef, {
        userId,
        mediaId,
        mediaType,
        title,
        poster,
        createdAt: new Date().toISOString()
      });
      return true; // added
    }
  },

  async isFavorite(userId: string, mediaId: string): Promise<boolean> {
    const favDocId = `${userId}_${mediaId}`;
    const docRef = doc(db, "favorites", favDocId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  },

  async getUserFavorites(userId: string): Promise<any[]> {
    const q = query(collection(db, "favorites"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    const favs: any[] = [];
    snapshot.forEach(docData => {
      favs.push({ id: docData.id, ...docData.data() });
    });
    return favs;
  },

  // COMMENTS
  async getComments(mediaId: string): Promise<Comment[]> {
    const q = query(
      collection(db, "comments"), 
      where("mediaId", "==", mediaId),
      orderBy("createdAt", "asc")
    );
    const snapshot = await getDocs(q);
    const comments: Comment[] = [];
    snapshot.forEach(docData => {
      comments.push({ id: docData.id, ...docData.data() } as Comment);
    });
    return comments;
  },

  async addComment(
    mediaId: string, 
    mediaType: "movie" | "series" | "anime", 
    mediaTitle: string,
    userId: string, 
    username: string, 
    userPhoto: string, 
    content: string, 
    parentId: string | null = null
  ): Promise<Comment> {
    
    // 1. Check moderation
    const modCheck = checkModeration(content);
    const pendingReview = modCheck.isViolating;

    const commentData = {
      mediaId,
      mediaType,
      userId,
      username,
      userPhoto,
      content,
      parentId,
      pendingReview,
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, "comments"), commentData);

    // 2. If flagged, auto create report
    if (pendingReview) {
      await addDoc(collection(db, "reports"), {
        reporterId: "system_moderator",
        targetType: "comment",
        targetId: docRef.id,
        targetName: `Comentario de @${username} en "${mediaTitle}"`,
        reason: "inappropriate",
        details: `Moderación automática: ${modCheck.reason}. Contenido: "${content}"`,
        status: "pending",
        autoDetected: true,
        createdAt: new Date().toISOString()
      });
    }

    return { id: docRef.id, ...commentData } as Comment;
  },

  async deleteComment(commentId: string) {
    await deleteDoc(doc(db, "comments", commentId));
  },

  async updateComment(commentId: string, newContent: string) {
    const docRef = doc(db, "comments", commentId);
    
    const modCheck = checkModeration(newContent);
    const pendingReview = modCheck.isViolating;

    await updateDoc(docRef, {
      content: newContent,
      pendingReview,
      updatedAt: new Date().toISOString()
    });

    if (pendingReview) {
      await addDoc(collection(db, "reports"), {
        reporterId: "system_moderator",
        targetType: "comment",
        targetId: commentId,
        targetName: `Comentario editado`,
        reason: "inappropriate",
        details: `Moderación automática en edición: ${modCheck.reason}. Contenido: "${newContent}"`,
        status: "pending",
        autoDetected: true,
        createdAt: new Date().toISOString()
      });
    }
  },

  // PLAYLISTS
  async getUserPlaylists(userId: string): Promise<Playlist[]> {
    const q = query(collection(db, "playlists"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    const lists: Playlist[] = [];
    snapshot.forEach(docData => {
      lists.push({ id: docData.id, ...docData.data() } as Playlist);
    });
    return lists;
  },

  async createPlaylist(userId: string, name: string, description: string, isPublic: boolean): Promise<Playlist> {
    const listData = {
      userId,
      name,
      description,
      isPublic,
      items: [],
      createdAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, "playlists"), listData);
    return { id: docRef.id, ...listData } as Playlist;
  },

  async updatePlaylistItems(playlistId: string, items: PlaylistItem[]) {
    const docRef = doc(db, "playlists", playlistId);
    await updateDoc(docRef, { items });
  },

  async deletePlaylist(playlistId: string) {
    await deleteDoc(doc(db, "playlists", playlistId));
  },

  // HISTORY
  async getHistory(userId: string): Promise<HistoryItem[]> {
    const q = query(
      collection(db, "history"), 
      where("userId", "==", userId),
      orderBy("updatedAt", "desc")
    );
    const snapshot = await getDocs(q);
    const history: HistoryItem[] = [];
    snapshot.forEach(docData => {
      history.push({ id: docData.id, ...docData.data() } as HistoryItem);
    });
    return history;
  },

  async saveHistoryItem(
    userId: string, 
    mediaId: string, 
    mediaType: "movie" | "series" | "anime", 
    title: string, 
    poster: string, 
    progress: number, 
    season: number | null = null, 
    episode: number | null = null
  ) {
    const historyDocId = `${userId}_${mediaId}`;
    const docRef = doc(db, "history", historyDocId);

    const historyData = {
      userId,
      mediaId,
      mediaType,
      title,
      poster,
      progress,
      season,
      episode,
      updatedAt: new Date().toISOString()
    };

    await setDoc(docRef, historyData);
  },

  async deleteHistoryItem(userId: string, mediaId: string) {
    const historyDocId = `${userId}_${mediaId}`;
    await deleteDoc(doc(db, "history", historyDocId));
  },

  async clearHistory(userId: string) {
    const q = query(collection(db, "history"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    const deletePromises: Promise<void>[] = [];
    snapshot.forEach(docData => {
      deletePromises.push(deleteDoc(doc(db, "history", docData.id)));
    });
    await Promise.all(deletePromises);
  },

  // REPORTS
  async createReport(
    reporterId: string, 
    targetType: "comment" | "user" | "media", 
    targetId: string, 
    targetName: string, 
    reason: "spam" | "inappropriate" | "copyright" | "violence" | "other", 
    details: string
  ) {
    await addDoc(collection(db, "reports"), {
      reporterId,
      targetType,
      targetId,
      targetName,
      reason,
      details,
      status: "pending",
      autoDetected: false,
      createdAt: new Date().toISOString()
    });
  },

  async getReports(): Promise<Report[]> {
    const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const reports: Report[] = [];
    snapshot.forEach(docData => {
      reports.push({ id: docData.id, ...docData.data() } as Report);
    });
    return reports;
  },

  async updateReportStatus(reportId: string, status: "resolved" | "dismissed") {
    await updateDoc(doc(db, "reports", reportId), { status });
  }
};
