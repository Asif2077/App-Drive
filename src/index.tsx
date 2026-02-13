
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { db } from './firebase'; 
import { collection, addDoc, deleteDoc, updateDoc, doc, query, onSnapshot, orderBy, getDocs, where, writeBatch } from "firebase/firestore";

// Imports from our new folders
import { DriveFile, Section, GOOGLE_SCRIPT_URL, uploadFileToDrive, getPreviewData } from './config';
import { IconMenu, IconClose, IconFolderPlus, IconList, IconCheck, IconEdit, IconTrash, IconChevronRight, IconCover, IconSearch, IconCloudUpload, IconExternal } from './components/Icons';
import { CoverGenerator } from './components/CoverGenerator';
import { FolderCard } from './components/FolderCard';
import { FileCard } from './components/FileCard';
import { UploadProgress } from './components/UploadProgress';
import { DeveloperCredit } from './components/DeveloperCredit';
//import { DeveloperCredit } from './components/DeveloperCredit'; 



const App = () => {
  // --- STATE ---
  const [sections, setSections] = useState<Section[]>([]);
  const [files, setFiles] = useState<DriveFile[]>([]); 
  const [activeSection, setActiveSection] = useState<string>('All Files');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const selectedFile = files.find(f => f.id === selectedFileId) || null; 

  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // ADMIN STATE
  const [isAdmin, setIsAdmin] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0); 
  const [showLogin, setShowLogin] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  
  // MODAL STATES
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [isCoverGenOpen, setIsCoverGenOpen] = useState(false); 
  
  // FORM STATES
  const [newFileName, setNewFileName] = useState('');
  const [newFileLink, setNewFileLink] = useState('');
  const [newFileDesc, setNewFileDesc] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null); 
  
  // BACKGROUND UPLOAD STATE
  const [isBackgroundUploading, setIsBackgroundUploading] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0); // <--- NEW PROGRESS STATE
  
  // RECOVERY STATE
  const [recoveryData, setRecoveryData] = useState<any>(null);

  // SECTION FORM STATES
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionAllowUploads, setNewSectionAllowUploads] = useState(false); 
  const [newSectionParentId, setNewSectionParentId] = useState<string | null>(null);

  const [targetFolder, setTargetFolder] = useState('');
  const [editingFileId, setEditingFileId] = useState<string | null>(null);

  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editSectionName, setEditSectionName] = useState('');

  // --- DATA PROCESSING ---
  const currentSectionData = sections.find(s => s.name === activeSection);

  useEffect(() => {
    const unsubscribeFiles = onSnapshot(query(collection(db, "files")), (snapshot) => {
        const loadedFiles: DriveFile[] = [];
        snapshot.forEach((doc) => loadedFiles.push({ id: doc.id, ...doc.data() } as DriveFile));
        setFiles(loadedFiles);
    });
    const unsubscribeSections = onSnapshot(query(collection(db, "sections"), orderBy("createdAt")), (snapshot) => {
        const loadedSections: Section[] = [];
        snapshot.forEach((doc) => loadedSections.push({ 
            id: doc.id, 
            name: doc.data().name,
            allowUploads: doc.data().allowUploads || false,
            parentId: doc.data().parentId || null
        } as Section));
        setSections(loadedSections);
    });
    return () => { unsubscribeFiles(); unsubscribeSections(); };
  }, []); 

  // --- RECOVERY SYSTEM ---
  useEffect(() => {
    const savedUpload = localStorage.getItem('pendingUpload');
    if (savedUpload) {
        try {
            const parsed = JSON.parse(savedUpload);
            setRecoveryData(parsed);
            setIsRecoveryModalOpen(true);
        } catch (e) {
            localStorage.removeItem('pendingUpload');
        }
    }
  }, []);

  const clearRecovery = () => {
      localStorage.removeItem('pendingUpload');
      setIsRecoveryModalOpen(false);
      setRecoveryData(null);
  };

  const handleResumeUpload = (e: React.FormEvent) => {
      e.preventDefault();
      if (!uploadFile) { alert("Please select the file again to resume."); return; }
      if (!recoveryData) return;

      setIsRecoveryModalOpen(false);
      processUploadInBackground(
          uploadFile,
          '', 
          recoveryData.fileName,
          recoveryData.fileDesc,
          recoveryData.userName,
          recoveryData.sectionName,
          recoveryData.userIsAdmin
      );
  };

  // --- PREVENT TAB CLOSE DURING UPLOAD ---
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if (isBackgroundUploading) {
            e.preventDefault();
            e.returnValue = ''; 
        }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isBackgroundUploading]);

  // --- NAVIGATION HANDLER ---
  const navigateTo = (sectionName: string) => {
      setActiveSection(sectionName);
      const newHash = sectionName === 'All Files' ? '' : `#${encodeURIComponent(sectionName)}`;
      window.history.pushState({ section: sectionName }, "", newHash);
  };

  useEffect(() => {
    const initialHash = window.location.hash.replace('#', '');
    if (initialHash) {
        setActiveSection(decodeURIComponent(initialHash));
    } else {
        window.history.replaceState({ section: 'All Files' }, "", "");
    }

    const handlePopState = (event: PopStateEvent) => {
        if (event.state && event.state.section) {
            setActiveSection(event.state.section);
        } else {
            const currentHash = window.location.hash.replace('#', '');
            if(currentHash) {
                setActiveSection(decodeURIComponent(currentHash));
            } else {
                setActiveSection('All Files');
            }
        }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []); 

  // --- ACTIONS ---
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if(passwordInput === 'Admin@321') { 
        setIsAdmin(true); 
        setShowLogin(false); 
        setPasswordInput(''); 
    } else { 
        alert('Wrong Password'); 
    }
  };

  const handleLogoClick = () => {
    if(isAdmin) return;
    setLogoClicks(prev => prev + 1);
    if(logoClicks + 1 >= 5) { 
        setShowLogin(true); 
        setLogoClicks(0); 
    }
  };

  const handleAddSection = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newSectionName.trim()) return;
      if (sections.some(s => s.name === newSectionName)) { alert('Folder name must be unique!'); return; }
      try {
          await addDoc(collection(db, "sections"), { 
              name: newSectionName, 
              createdAt: Date.now(),
              allowUploads: newSectionAllowUploads,
              parentId: newSectionParentId
          });
          setNewSectionName(''); 
          setNewSectionAllowUploads(false);
          setIsSectionModalOpen(false); 
      } catch (e) { alert("Error creating section"); }
  };

  const toggleSectionUploads = async (section: Section) => {
      if(!isAdmin) return;
      try {
          await updateDoc(doc(db, "sections", section.id), {
              allowUploads: !section.allowUploads
          });
      } catch (e) { alert("Error changing permission"); }
  };

  const startEditingSection = (section: Section) => {
      setEditingSectionId(section.id);
      setEditSectionName(section.name);
  };

  const saveEditedSection = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!editingSectionId || !editSectionName.trim()) return;
      const oldSection = sections.find(s => s.id === editingSectionId);
      const oldName = oldSection?.name;
      if (!oldName) return;

      try {
          const sectionRef = doc(db, "sections", editingSectionId);
          await updateDoc(sectionRef, { name: editSectionName });
          const q = query(collection(db, "files"), where("section", "==", oldName));
          const querySnapshot = await getDocs(q);
          const batch = writeBatch(db);
          querySnapshot.forEach((fileDoc) => {
              const fileRef = doc(db, "files", fileDoc.id);
              batch.update(fileRef, { section: editSectionName });
          });
          await batch.commit();
          if (activeSection === oldName) {
              navigateTo(editSectionName);
          }
          setEditingSectionId(null);
          setEditSectionName('');
      } catch (error) { alert("Error updating folder name"); }
  };

  const handleDeleteSection = async (sectionId: string, sectionName: string) => {
      if(confirm(`Delete folder "${sectionName}"? Files inside will be deleted.`)) {
          try {
              await deleteDoc(doc(db, "sections", sectionId));
              const q = query(collection(db, "files"), where("section", "==", sectionName));
              const querySnapshot = await getDocs(q);
              const batch = writeBatch(db);
              querySnapshot.forEach((fileDoc) => {
                  batch.delete(fileDoc.ref);
              });
              await batch.commit();
              if (activeSection === sectionName) navigateTo('All Files'); 
          } catch(e) { alert("Error deleting section"); }
      }
  };

  // --- BACKGROUND UPLOAD LOGIC ---
  const processUploadInBackground = async (
    file: File | null, 
    link: string, 
    fileName: string, 
    fileDesc: string, 
    userName: string, 
    sectionName: string,
    userIsAdmin: boolean
  ) => {
      if (file) {
          localStorage.setItem('pendingUpload', JSON.stringify({
              fileName, fileDesc, userName, sectionName, userIsAdmin, timestamp: Date.now()
          }));
      }

      setIsBackgroundUploading(true);
      setUploadingFileName(fileName);
      setUploadProgress(0); // Reset progress on start
      
      let finalLink = link;
      let finalType: DriveFile['type'] = 'link';

      try {
        if (file) {
            if (!GOOGLE_SCRIPT_URL.startsWith('http')) {
                alert("Google Script URL is missing!");
                setIsBackgroundUploading(false);
                return;
            }
            // PASS THE PROGRESS CALLBACK HERE
            finalLink = await uploadFileToDrive(file, (percent) => {
                setUploadProgress(percent);
            });
            
            const mime = file.type;
            if (mime.includes('pdf')) finalType = 'pdf';
            else if (mime.includes('image')) finalType = 'image';
            else if (mime.includes('sheet') || mime.includes('excel')) finalType = 'sheet';
            else if (mime.includes('document') || mime.includes('word')) finalType = 'doc';
            else if (mime.includes('presentation')) finalType = 'slide';
            else finalType = 'link';
        } else {
             try {
                const url = new URL(link);
                if(!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid Protocol');
            } catch(err) {}
        }

        if (finalType === 'link') {
            const ext = fileName.split('.').pop()?.toLowerCase();
            if (ext === 'pdf') finalType = 'pdf';
            else if (['doc', 'docx'].includes(ext || '')) finalType = 'doc';
            else if (['xls', 'xlsx'].includes(ext || '')) finalType = 'sheet';
        }

        let finalDesc = fileDesc || "No description provided.";

        await addDoc(collection(db, "files"), {
            name: fileName, 
            type: finalType, 
            owner: userIsAdmin ? 'Admin' : userName, 
            section: sectionName,
            content: finalDesc, 
            link: finalLink
        });

        localStorage.removeItem('pendingUpload');

      } catch (error) {
          console.error("Upload Error:", error);
          alert("Upload failed: " + error);
      } finally {
          setIsBackgroundUploading(false);
          setUploadingFileName('');
          setUploadProgress(0);
      }
  };

  const handleSaveFileOrLink = (e: React.FormEvent) => {
    e.preventDefault();
    if(!newFileName) { alert("Please fill in file name."); return; }
    if(!uploadFile && !newFileLink) { alert("Please provide a Link OR Upload a File."); return; }
    if (!isAdmin && !newUserName.trim()) { alert("Please enter your full name."); return; }
    
    if (!uploadFile && newFileLink) {
        try {
            const url = new URL(newFileLink);
            if(!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid Protocol');
        } catch(err) {
            alert("Please enter a valid URL");
            return;
        }
    }

    const fileToUpload = uploadFile;
    const linkToSave = newFileLink;
    const nameToSave = newFileName;
    const descToSave = newFileDesc;
    const userToSave = newUserName;
    const sectionToSave = activeSection; 
    const adminStatus = isAdmin;

    setIsAddModalOpen(false);
    setNewFileName(''); setNewFileLink(''); setNewFileDesc(''); setNewUserName(''); setUploadFile(null);

    processUploadInBackground(fileToUpload, linkToSave, nameToSave, descToSave, userToSave, sectionToSave, adminStatus);
  };

  const openEditModal = (file: DriveFile) => {
      setNewFileName(file.name); setNewFileLink(file.link || ''); setNewFileDesc(file.content);
      setTargetFolder(file.section); 
      setEditingFileId(file.id); setIsEditModalOpen(true);
  };

  const handleUpdateFile = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!editingFileId || !newFileName) return;
      try {
          await updateDoc(doc(db, "files", editingFileId), { 
              name: newFileName, link: newFileLink, content: newFileDesc, section: targetFolder 
          });
          setIsEditModalOpen(false); setEditingFileId(null);
          setNewFileName(''); setNewFileLink(''); setNewFileDesc('');
      } catch (e) { alert("Error updating file"); }
  };

  const handleDeleteFile = async (id: string) => {
      if(confirm('Delete this file?')) {
          try { await deleteDoc(doc(db, "files", id)); if(selectedFileId === id) setSelectedFileId(null); } 
          catch(e) { alert("Error deleting file"); }
      }
  };

  // --- FILTERS ---
  const filteredFiles = files.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeSection === 'All Files' && searchQuery.trim()) return matchesSearch;
    return f.section === activeSection && matchesSearch;
  });

  const subFolders = sections.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (activeSection === 'All Files' && searchQuery.trim()) return matchesSearch;
      if (activeSection === 'All Files') return !s.parentId; 
      return s.parentId === currentSectionData?.id;
  });

  const canUpload = activeSection !== 'All Files' && (isAdmin || (currentSectionData?.allowUploads));
  const rootSections = sections.filter(s => !s.parentId);

  const getBreadcrumbs = () => {
      if (activeSection === 'All Files') return [{name: 'All Files', id: 'root'}];
      const crumbs = [];
      let curr = currentSectionData;
      while (curr) {
          crumbs.unshift({ name: curr.name, id: curr.id });
          curr = sections.find(s => s.id === curr?.parentId);
      }
      crumbs.unshift({ name: 'All Files', id: 'root' });
      return crumbs;
  };

  const selectedPreview = selectedFile ? getPreviewData(selectedFile.link) : null;

  return (
    <div className="flex flex-col h-screen md:flex-row font-sans text-gray-100 bg-[#0f172a]">
      
      {/* INJECTED CUSTOM CSS FOR BOUNCE ANIMATION */}
      <style>{`
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.9) translateY(10px); }
          70% { transform: scale(1.02) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-pop-in {
          animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>

      {/* COVER GENERATOR COMPONENT */}
      {isCoverGenOpen && <CoverGenerator onClose={() => setIsCoverGenOpen(false)} />}
      
      <UploadProgress isUploading={isBackgroundUploading} fileName={uploadingFileName} progress={uploadProgress} />
       
      {/* MOBILE HEADER */}
      <div className="md:hidden bg-gray-900/90 backdrop-blur-md p-4 border-b border-white/10 flex items-center justify-between sticky top-0 z-20">
         <div className="flex items-center gap-3 select-none" onClick={handleLogoClick}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
               <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
            </div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">Notes & Files</h1>
         </div>
         <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg">
             <IconMenu />
         </button>
      </div>
            

      {isMobileMenuOpen && <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200" onClick={() => setIsMobileMenuOpen(false)} />}
        
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900/95 backdrop-blur-xl border-r border-white/10 flex flex-col h-full transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:bg-gray-900/50 ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer select-none" onClick={handleLogoClick}>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                   <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                </div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">Notes</h1>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-400 hover:text-white"><IconClose /></button>
        </div>

        {isAdmin && (
            <div className="px-4 pb-4 space-y-2">
                <button onClick={() => { setNewSectionParentId(null); setNewSectionName(''); setNewSectionAllowUploads(false); setIsSectionModalOpen(true); }} className="w-full py-2 px-4 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg font-medium border border-white/5 flex items-center justify-center text-sm gap-2">
                    <IconFolderPlus /> New Root Folder
                </button>
                <div className="mt-2 text-center text-xs text-green-400">● Admin Mode Active</div>
            </div>
        )}

        <div className="px-4 mt-2"><div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2">Folders</div></div>

        <nav className="px-4 space-y-1 mt-2 mb-4 flex-1 overflow-y-auto">
            <button onClick={() => { navigateTo('All Files'); setIsMobileMenuOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition flex justify-between items-center ${activeSection === 'All Files' ? 'bg-indigo-500/20 text-white border border-indigo-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <div className="flex items-center gap-2"><IconList /> All Files</div>
            </button>
            <div className="border-t border-white/5 my-2 mx-1"></div>
            {rootSections.map((section) => (
                <div key={section.id} className="group flex items-center gap-1">
                   {editingSectionId === section.id ? (
                       <form onSubmit={saveEditedSection} className="flex-1 flex items-center gap-1 px-1">
                           <input className="flex-1 bg-black/20 border border-indigo-500/50 rounded-lg text-sm px-2 py-1 text-white focus:outline-none" value={editSectionName} onChange={(e) => setEditSectionName(e.target.value)} autoFocus onClick={(e) => e.stopPropagation()} />
                           <button type="submit" className="p-1.5 text-green-400 hover:bg-green-400/10 rounded-md transition"><IconCheck /></button>
                           <button onClick={() => setEditingSectionId(null)} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-md transition"><IconClose /></button>
                       </form>
                   ) : (
                       <>
                           <button onClick={() => { navigateTo(section.name); setIsMobileMenuOpen(false); }} className={`flex-1 text-left px-3 py-2 rounded-lg text-sm font-medium transition flex justify-between items-center ${activeSection === section.name ? 'bg-indigo-500/20 text-white border border-indigo-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                               <span>{section.name}</span>
                               {!section.allowUploads && isAdmin && <span className="text-[10px] bg-red-500/20 text-red-300 px-1.5 rounded ml-2">Locked</span>}
                           </button>
                           {isAdmin && (
                               <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button onClick={(e) => { e.stopPropagation(); startEditingSection(section); }} className="p-2 text-gray-500 hover:text-indigo-400 transition"><IconEdit /></button>
                                   <button onClick={(e) => { e.stopPropagation(); handleDeleteSection(section.id, section.name); }} className="p-2 text-gray-500 hover:text-red-400 transition"><IconTrash /></button>
                               </div>
                           )}
                       </>
                   )}
                </div>
            ))}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative bg-gradient-to-br from-[#0f172a] to-[#1e1b4b]">
        <div className="flex flex-col gap-6 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm text-gray-400 overflow-x-auto">
                        {getBreadcrumbs().map((crumb, index, arr) => (
                            <React.Fragment key={crumb.name}>
                                <button onClick={() => navigateTo(crumb.name)} className={`hover:text-white transition whitespace-nowrap ${index === arr.length - 1 ? 'text-white font-bold' : ''}`}>
                                    {crumb.name}
                                </button>
                                {index < arr.length - 1 && <IconChevronRight />}
                            </React.Fragment>
                        ))}
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                        <h2 className="text-3xl font-bold text-white tracking-tight">{activeSection}</h2>
                        {isAdmin && activeSection !== 'All Files' && currentSectionData && (
                            <div onClick={() => toggleSectionUploads(currentSectionData)} className={`cursor-pointer px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 select-none border transition-all ${currentSectionData.allowUploads ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}>
                                <div className={`w-2 h-2 rounded-full ${currentSectionData.allowUploads ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                                {currentSectionData.allowUploads ? 'Uploads ON' : 'Uploads OFF'}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT SIDE CONTAINER */}
                <div className="w-full md:w-auto flex flex-col gap-3 items-end">
                    
                    {/* 1. COVER GENERATOR (Visible ONLY on All Files page) - ADDED GLOW EFFECT HERE */}
                    {activeSection === 'All Files' && (
                        <button 
                            onClick={() => setIsCoverGenOpen(true)} 
                            className="py-3 px-5 bg-purple-800/45 hover:bg-teal-500/25 rounded-3xl text-white text-md font-bold transition flex items-center gap-2 border border-white/30 shadow-md shadow-purple-300/45 "
                        >
                            <IconCover /> Cover page Generator
                        </button>
                    )}

                    {/* 2. SEARCH & ACTIONS ROW (Below the button) */}
                    <div className="flex flex-col md:flex-row gap-3 items-center w-full">
                        <div className="relative w-full md:w-64 group">
                            <div className="absolute left-3 top-3 text-gray-400 group-focus-within:text-indigo-400"><IconSearch /></div>
                            <input 
                                type="text" 
                                placeholder={`Search in ${activeSection}...`} 
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition shadow-inner" 
                                value={searchQuery} 
                                onChange={(e) => setSearchQuery(e.target.value)} 
                            />
                        </div>
                        
                        {/* FOLDER ACTIONS (Hidden on All Files) */}
                        {activeSection !== 'All Files' && (
                            <>
                                {isAdmin && (
                                    <button onClick={() => { if(!currentSectionData) return; setNewSectionParentId(currentSectionData.id); setNewSectionName(''); setNewSectionAllowUploads(false); setIsSectionModalOpen(true); }} className="w-full md:w-auto py-2.5 px-4 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm font-bold shadow-lg transition flex items-center justify-center gap-2 border border-white/5 whitespace-nowrap">
                                        <IconFolderPlus /> New Folder
                                    </button>
                                )}
                                {canUpload && (
                                    <button onClick={() => { setNewFileName(''); setNewFileLink(''); setNewFileDesc(''); setUploadFile(null); setIsAddModalOpen(true); }} className="w-full md:w-auto py-2.5 px-5 bg-teal-800/20 hover:bg-black-900 shadow-cyan-500/35 hover:shadow-cyan-500/35 rounded-full text-orange-400 text-sm font-bold shadow-lg transition flex items-center justify-center gap-2 whitespace-nowrap">
                                        <IconCloudUpload /> Add File
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {subFolders.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subFolders.map(folder => (
                        <FolderCard key={folder.id} section={folder} onClick={(name: string) => navigateTo(name)} isAdmin={isAdmin} onEdit={startEditingSection} onDelete={handleDeleteSection} onToggle={toggleSectionUploads} />
                    ))}
                </div>
            )}
            
            {subFolders.length > 0 && filteredFiles.length > 0 && <div className="border-t border-white/5"></div>}

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {filteredFiles.length > 0 ? (
                    filteredFiles.map(file => (
                        <FileCard key={file.id} file={file} onClick={() => setSelectedFileId(file.id)} isAdmin={isAdmin} onEdit={openEditModal} onDelete={handleDeleteFile} />
                    ))
                ) : (
                    subFolders.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center h-48 text-gray-500 border-2 border-dashed border-white/10 rounded-3xl">
                            <p className="text-lg font-medium">This folder is empty</p>
                            {canUpload && activeSection !== 'All Files' && <button onClick={() => setIsAddModalOpen(true)} className="mt-4 px-6 py-2 bg-indigo-600/20 text-cyan-400 hover:bg-teal-800 hover:text-white rounded-full transition font-bold  border border-indigo-500/30">+ Add First File</button>}
                        </div>
                    )
                )}
            </div>
        </div>
        {/* MAIN CONTENT */}
      

        {/* PASTE IT HERE: AT THE VERY BOTTOM OF MAIN */}
      {/* showOnMobile={true} only if we are in 'All Files'.
           On PC, the component ignores this and shows itself anyway.
        */}
        <DeveloperCredit showOnMobile={activeSection === 'All Files'} />

       {/* Closing tag of main */}
        
      
      </main>

      {/* --- PREVIEW MODAL (REPLACED SIDEBAR WITH GLASS CARD) --- */}
      {selectedFile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="w-full max-w-lg rounded-3xl relative bg-white/10 backdrop-blur-sm border border-white/40 shadow-[0_0_40px_rgba(255,255,255,0.20)] flex flex-col animate-pop-in max-h-[90vh]">
                  
                  {/* Modal Header */}
                  <div className="p-5 border-b border-white/10 flex items-center justify-center items-start">
                      <h2 className="text-xl font-bold text-white truncate pr-4">{selectedFile.name}</h2>
                      <button 
  onClick={() => setSelectedFileId(null)} 
  className="absolute top-4 right-4 p-2 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-full transition transform hover:scale-110 z-20"
>
  <div className="scale-125"> {/* Makes the icon itself bigger */}
    <IconClose />
  </div>
</button>
                  </div>

                  {/* Modal Content */}
                  <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                      {selectedPreview && (
                          <div className="w-full rounded-xl overflow-hidden bg-black/40 border border-white/10 shadow-lg">
                              {selectedPreview.type === 'youtube' && selectedPreview.video ? (
                                  <iframe src={selectedPreview.video} className="w-full h-56" title="Preview" allowFullScreen />
                              ) : (
                                  <img src={selectedPreview.src} alt="Preview" className="w-full h-auto object-contain max-h-64 mx-auto" />
                              )}
                          </div>
                      )}
                      <div>
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Description</label>
                          <div className="bg-black/30 p-4 rounded-xl text-sm text-gray-200 font-mono break-all border border-white/5 shadow-inner">
                              <p>{selectedFile.content || "No description provided."}</p>
                          </div>
                      </div>
                      
                      {/* Open Resource Button with Glass Gradient */}
                      <button 
                        onClick={() => selectedFile.link && selectedFile.link !== '#' ? window.open(selectedFile.link, '_blank') : alert("Demo")} 
                        className="w-full py-3.5 rounded-full text-white font-bold shadow-lg transition flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600/80 to-purple-500/80 hover:from-purple-400/80 hover:to-purple-900/80 backdrop-blur-md border border-white/20"
                      >
                          <IconExternal /> Open Link
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- MODALS --- */}
      {showLogin && (
           <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="bg-[#1e293b] w-full max-w-xs rounded-2xl border border-white/10 shadow-2xl p-6 animate-pop-in">
                  <h2 className="text-xl font-bold mb-4 text-white flex items-center justify-center">Admin Login</h2>
                  <form onSubmit={handleAdminLogin}>
                        <input type="password" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-indigo-500 focus:outline-none transition mb-4" placeholder="Enter Password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} autoFocus />
                        <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-bold">Unlock</button>
                  </form>
              </div>
           </div>
      )}

      {/* FIXED ADD/EDIT MODAL: Scrollable on mobile keyboards */}
      {(isAddModalOpen || isEditModalOpen) && (
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="flex min-h-full items-center justify-center p-4">
                  <div className="w-full max-w-md rounded-2xl shadow-2xl p-6 relative bg-white/10 backdrop-blur-2xl border border-white/30 shadow-[0_0_40px_rgba(255,255,255,0.20)] animate-pop-in">
                      <button onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="absolute top-4 right-4 text-red-400 hover:text-red-300 scale-150"><IconClose /></button>
                      <h2 className="text-2xl font-bold mb-4 text-white flex items-center justify-center">{isEditModalOpen ? 'Edit File' : 'Add File'}</h2>
                      
                      <form onSubmit={isEditModalOpen ? handleUpdateFile : handleSaveFileOrLink} className="space-y-4">
                          {!isAdmin && !isEditModalOpen && (
                              <input className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-indigo-500 focus:outline-none transition" placeholder="Your Full Name (Required)" value={newUserName} onChange={e => setNewUserName(e.target.value)} autoFocus />
                          )}
                          
                          <input className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-indigo-500 focus:outline-none transition" placeholder="File Name (Required)" value={newFileName} onChange={e => setNewFileName(e.target.value)} />
                          
                          {/* FILE UPLOAD INPUT */}
                          {!isEditModalOpen && (
                              <div className="p-3 bg-black/20 border border-white/10 rounded-xl">
                                <label className="text-xs text-gray-400 font-bold uppercase block mb-2">Upload File - OR - Paste Link</label>
                                <input type="file" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-800/50 file:text-white hover:file:bg-teal-600/35 mb-3  shadow-teal-500/35" onChange={(e) => { if(e.target.files) setUploadFile(e.target.files[0]); }} />
                                <div className="flex items-center gap-2 mb-2"><div className="h-px bg-white/10 flex-1"></div><span className="text-xs text-gray-500 font-bold">OR</span><div className="h-px bg-white/10 flex-1"></div></div>
                                <input className="w-full bg-black/40 border border-white/5 rounded-lg p-2 text-white text-sm focus:border-indigo-500 focus:outline-none transition" placeholder="Paste External Link (Google Drive, OneDrive...)" value={newFileLink} onChange={e => setNewFileLink(e.target.value)} />
                              </div>
                          )}
                          
                          {isEditModalOpen && (
                              <>
                               <input className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-indigo-500 focus:outline-none transition" placeholder="Link" value={newFileLink} onChange={e => setNewFileLink(e.target.value)} />
                               <div className="space-y-1">
                                  <label className="text-xs text-gray-400 font-bold uppercase">Folder</label>
                                  <div className="relative group">
  {/* Custom Arrow Icon (The default one is ugly) */}
  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
    <svg className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </div>

  {/* The Select Input */}
  <select 
    className="w-full appearance-none bg-gray-900/60 backdrop-blur-xl border border-white/20 rounded-xl p-3 pr-10 text-white shadow-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none transition-all cursor-pointer hover:bg-gray-800/60" 
    value={targetFolder} 
    onChange={e => setTargetFolder(e.target.value)}
  >
    {sections.map(s => (
      <option 
        key={s.id} 
        value={s.name} 
        className="bg-gray-900 text-gray-200 py-2" // Options MUST be solid color
      >
        {s.name}
      </option>
    ))}
  </select>
</div>
                               </div>
                              </>
                          )}

                          <textarea className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-indigo-500 focus:outline-none transition h-24 resize-none" placeholder="Description (e.g,...Rakib Sir)/optional" value={newFileDesc} onChange={e => setNewFileDesc(e.target.value)} />
                          
                          <button type="submit" className={`w-full py-3 rounded-full text-white font-bold shadow-lg flex items-center justify-center gap-2 bg-teal-800/80 hover:bg-cyan-400/35 backdrop-blur-md shadow-[0_0_20px_rgba(99,102,241,0.2)] `}>
                              {isEditModalOpen ? 'Update' : 'Save'}
                          </button>
                      </form>
                  </div>
              </div>
          </div>
      )}

      {isSectionModalOpen && (
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
               <div className="flex min-h-full items-center justify-center p-4">
                  <div className="bg-[#1e293b] w-full max-w-sm rounded-2xl border border-white/10 shadow-2xl p-6 relative animate-pop-in">
                      <button onClick={() => setIsSectionModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><IconClose /></button>
                      <h2 className="text-xl font-bold mb-4 text-white">{newSectionParentId ? 'New Subfolder' : 'New Root Folder'}</h2>
                      <form onSubmit={handleAddSection} className="space-y-4">
                          <input className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-indigo-500 focus:outline-none transition" placeholder="Folder Name" value={newSectionName} onChange={e => setNewSectionName(e.target.value)} autoFocus />
                          <label className="flex items-center gap-3 p-3 bg-black/20 rounded-xl cursor-pointer border border-white/5 hover:bg-black/30 transition">
                              <input type="checkbox" className="w-5 h-5 rounded border-gray-500 text-indigo-600 focus:ring-indigo-500 bg-gray-700" checked={newSectionAllowUploads} onChange={(e) => setNewSectionAllowUploads(e.target.checked)} />
                              <div className="flex flex-col">
                                  <span className="font-bold text-sm text-gray-200">Allow Users to Upload</span>
                                  <span className="text-xs text-gray-500">If unchecked, only Admin can add files</span>
                              </div>
                          </label>
                          <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-bold shadow-lg">Create Folder</button>
                      </form>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);