// src/components/FileCard.tsx
import React, { useState, useEffect } from 'react';
import { IconDoc, IconSheet, IconSlide, IconPdf, IconLink, IconEdit, IconTrash, IconExternal } from './Icons';
import { getPreviewData, DriveFile } from '../config';

interface FileCardProps {
    file: DriveFile;
    onClick: (file: DriveFile) => void;
    isAdmin: boolean;
    onEdit: (file: DriveFile) => void;
    onDelete: (id: string) => void;
}

export const FileCard:React.FC<FileCardProps> = ({ file, onClick, isAdmin, onEdit, onDelete }: FileCardProps) => {
    const preview = getPreviewData(file.link);
    const [imgError, setImgError] = useState(false);

    // Reset error state if file changes
    useEffect(() => {
        setImgError(false);
    }, [file.id, file.link]);

    return (
        <div 
            onClick={() => onClick(file)}
            className="glass-card bg-teal-900/30 backdrop-blur-md border border-white/30 rounded-2xl shadow-2g hover:border-indigo-500/50 hover:bg-white/10 rounded-2xl flex flex-col h-56 relative group cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/20 overflow-hidden"
        >
            {/* Image Container */}
            <div className="h-32 w-full bg-black/20 flex items-center justify-center relative overflow-hidden">
                {preview && !imgError ? (
                    <img 
                        src={preview.src} 
                        alt={file.name} 
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                        onError={(e) => {
                            e.currentTarget.style.display = 'none'; 
                            setImgError(true);
                        }} 
                    />
                ) : (
                    <div className="h-full w-full flex items-center justify-center p-4 rounded-xl bg-black/20 text-white shadow-inner transform group-hover:scale-110 transition-transform">
                        {file.type === 'doc' && <IconDoc />}
                        {file.type === 'sheet' && <IconSheet />}
                        {file.type === 'pdf' && <IconPdf />}
                        {file.type === 'slide' && <IconSlide />}
                        {file.type === 'link' && <IconLink />}
                        {file.type === 'image' && <IconLink />}
                    </div>
                )}
                
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-[10px] uppercase font-bold text-gray-300">
                    {file.type}
                </div>
            </div>
            
            {/* 4. CONTENT AREA (Bottom Half) */}
            <div className="p-4 flex flex-col flex-1 justify-between">
                <div>
                    {/* Title with gap below */}
                    <h3 className="font-bold text-lg text-white leading-tight mb-6 line-clamp-2" title={file.name}>
                        {file.name}
                    </h3>
                    
                    {/* Metadata: Just "Added by" (Right side removed) */}
                    <div className="flex flex-items-center justify-center gap-2 w-full">
                        <span className="text-gray-500 font-medium text-[10px] tracking-wide">
                            Added by
                        </span>
                        <span className="text-sm font-semibold text-white truncate">
                            {file.owner}
                        </span>
                    </div>
                </div>

                {/* Edit/Delete Buttons (Only appear on hover for Admins) */}
                {isAdmin && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={(e) => { e.stopPropagation(); onEdit(file); }} className="flex-1 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white text-xs font-bold flex items-center justify-center"><IconEdit /></button>
                         <button onClick={(e) => { e.stopPropagation(); onDelete(file.id); }} className="flex-1 py-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white text-xs font-bold flex items-center justify-center"><IconTrash /></button>
                    </div>
                )}
            </div>
           </div>
        
    );
};