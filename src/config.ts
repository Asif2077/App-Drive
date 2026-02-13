// src/config.ts

// YOUR DEPLOYMENT URL
export const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxKM6EKXtDtnl6HJtJ_Il6FInSnqB0HN6Vi_94q_H-HRw4MNp0ZXIoGKITacCHvY7ACQw/exec";

export interface DriveFile {
  id: string;
  name: string;
  type: 'doc' | 'sheet' | 'slide' | 'pdf' | 'text' | 'link' | 'image' | 'video';
  owner: string;
  section: string;
  content: string; 
  link?: string;
}

export interface Section {
    id: string;
    name: string;
    allowUploads?: boolean;
    parentId?: string | null;
}

// Helper: Upload to Google Drive (Hybrid XHR + Fetch)
// Added 'onProgress' callback to track percentage
export const uploadFileToDrive = async (file: File, onProgress?: (percent: number) => void): Promise<string> => {
    
    console.log("Starting upload process for:", file.name);

    // --- STEP 1: Get Upload URL (Using Fetch) ---
    // We stick with fetch here because it's a simple JSON request
    let initData;
    try {
        const initResponse = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({
                action: "getUrl",
                filename: file.name,
                mimeType: file.type
            })
        });

        if (!initResponse.ok) throw new Error("Script unavailable");
        initData = await initResponse.json();
        if (initData.status !== "success") throw new Error(initData.message);

    } catch (e: any) {
        throw new Error("Could not connect to script: " + e.message);
    }

    console.log("Got Upload URL, starting XHR transfer...");

    // --- STEP 2: Upload Content (Using XMLHttpRequest) ---
    // This allows us to track progress and handle CORS "false failures"
    let newFileId = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", initData.uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);

        // Track Upload Progress
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable && onProgress) {
                const percent = Math.round((event.loaded / event.total) * 100);
                onProgress(percent);
            }
        };

        xhr.onload = () => {
            // Status 200/201 = Success
            // Status 0 or 403 = Often a CORS issue, but file might be there. We resolve anyway to let Step 3 verify.
            if (xhr.status === 200 || xhr.status === 201) {
                try {
                    const resp = JSON.parse(xhr.responseText);
                    resolve(resp.id);
                } catch (e) {
                    // If response isn't JSON, we resolve undefined and let Step 3 handle it
                    resolve(""); 
                }
            } else {
                // If it fails with a weird status, we still resolve to let Step 3 check if it actually saved.
                console.warn("XHR ended with status:", xhr.status, "Attempting verification...");
                resolve(""); 
            }
        };

        xhr.onerror = () => {
            // Network errors often show up here. 
            // However, large uploads sometimes trigger this due to browser timeout while waiting for server response.
            // We proceed to Step 3 to check if the file exists.
            console.warn("XHR Network Error triggered. Attempting verification...");
            resolve(""); 
        };

        xhr.send(file);
    });

    // --- PAUSE: Wait for Google Drive Indexing ---
    await new Promise(resolve => setTimeout(resolve, 2500));

    // --- STEP 3: Finalize & Verify (Fetch) ---
    // We send the fileId (if we got it) OR just ask the script to look for the file by name/time
    try {
        const finalResponse = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({
                action: "finalize",
                fileId: newFileId || undefined, // If XHR failed to give ID, script might need fallback logic
                filename: file.name // Fallback: help script find the file
            })
        });

        const finalData = await finalResponse.json();
        
        if (finalData.status === "success") {
            onProgress && onProgress(100); // Ensure we hit 100%
            return finalData.link;
        } else {
            throw new Error(finalData.message || "Upload verification failed");
        }

    } catch (e: any) {
        throw new Error("File uploaded but verification failed: " + e.message);
    }
};

export const getPreviewData = (url?: string) => {
    if (!url) return null;
    
    // 1. YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId = '';
        if (url.includes('youtu.be')) videoId = url.split('/').pop() || '';
        else videoId = new URLSearchParams(new URL(url).search).get('v') || '';
        if (videoId) return { type: 'youtube', src: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`, video: `https://www.youtube.com/embed/${videoId}` };
    }

    // 2. Direct Image Links
    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(url)) {
        return { type: 'image', src: url };
    }

    // 3. Google Drive (Robust ID Extraction)
    const driveRegex = /[-\w]{25,}/;
    const match = url.match(driveRegex);
    
    if (match && (url.includes('drive.google.com') || url.includes('docs.google.com'))) {
        const id = match[0];
        // Added retry/fallback logic by not hardcoding one URL
        return { type: 'drive', src: `https://drive.google.com/thumbnail?id=${id}&sz=w500` };
    }
    
    return null;
};