// src/components/FolderCard.tsx
import React from 'react';
import { IconFolder, IconCheck, IconEdit, IconTrash } from './Icons';
import { Section } from '../config';

interface FolderCardProps {
    section: Section;
    onClick: (name: string) => void;
    isAdmin: boolean;
    onEdit: (section: Section) => void;
    onDelete: (id: string, name: string) => void;
    onToggle: (section: Section) => void;
}

export const FolderCard:React.FC<FolderCardProps> = ({ section, onClick, isAdmin, onEdit, onDelete, onToggle }: FolderCardProps) => {
    return (
        <div 
            onClick={() => onClick(section.name)}
            className="glass-card bg-[#1e293b]/50 border border-indigo-500/20 hover:border-indigo-500 hover:bg-[#1e293b] rounded-2xl flex items-center p-4 gap-4 cursor-pointer transition-all duration-200 group relative"
        >
            <div className="flex-shrink-0"><IconFolder /></div>
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white truncate">{section.name}</h3>
                {isAdmin && (
                    <p className="text-xs text-gray-400">{section.allowUploads ? 'Uploads Allowed' : 'Read Only'}</p>
                )}
            </div>
            
            {isAdmin && (
                 <div className="absolute right-2 top-2 bottom-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1e293b] pl-2 rounded-r-xl">
                    <button onClick={(e) => { e.stopPropagation(); onToggle(section); }} className={`p-1.5 rounded-lg ${section.allowUploads ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`} title="Toggle Uploads">
                        {section.allowUploads ? <IconCheck /> : <div className="w-4 h-4 border-2 border-red-400 rounded-full" />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onEdit(section); }} className="p-1.5 text-indigo-300 hover:bg-indigo-500/20 rounded-lg"><IconEdit /></button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(section.id, section.name); }} className="p-1.5 text-red-300 hover:bg-red-500/20 rounded-lg"><IconTrash /></button>
                 </div>
            )}
        </div>
    );
};