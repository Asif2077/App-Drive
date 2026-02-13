// src/components/CoverGenerator.tsx
import React, { useState, useEffect } from 'react';
import { IconClose, IconPrint } from './Icons';
import sauLogo from "../sau-logo.png"; 

export const CoverGenerator = ({ onClose }: { onClose: () => void }) => {
    const [logo, setLogo] = useState<string>(sauLogo);
    
    const [formData, setFormData] = useState({
        assignTitle: "Assignment",
        courseTitle: "",
        courseCode: "",
        date: "",
        name: "Md. Afif Hossain",
        reg: "24010417",
        level: "Level-2, Semester-I",
        sec: "-1",
        group: "B",
        faculty: "Faculty of Agribusiness Management",
        tname: "",
        desig: "Professor",
        dept: "Department of Agricultural Statistics"
    });

    useEffect(() => {
        const savedLogo = localStorage.getItem('sau_cover_logo');
        if (savedLogo) setLogo(savedLogo);
    }, []);

    const handleChange = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const result = ev.target?.result as string;
                setLogo(result);
                localStorage.setItem('sau_cover_logo', result);
                alert("Custom Logo Saved!");
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const generatorStyles = `
        @import url('https://fonts.googleapis.com/css2?family=Tinos:ital,wght@0,400;0,700;1,400;1,700&display=swap');

        /* --- GLOBAL & SCROLLBAR --- */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { bg: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.4); }

        .gen-root {
            /* Clean background to let the glass shine */
            background-color: transparent; 
            font-family: 'Segoe UI', sans-serif;
            display: flex;
            gap: 40px;
            justify-content: center;
            min-height: 100vh;
            padding: 40px;
            box-sizing: border-box;
        }

        /* --- GLASS CARD CONTROL PANEL --- */
        .gen-controls {
            width: 320px;
            /* Glass Effect */
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(19px);
            -webkit-backdrop-filter: blur(19px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
            
            padding: 30px;
            border-radius: 24px;
            height: fit-content;
            display: flex;
            flex-direction: column;
            gap: 15px;
            color: #fff;
        }

        .gen-controls h2 { 
            margin: 0; 
            color: #ffffff;
            font-size: 1.5rem; 
            font-weight: 700; 
            text-align: center;
            margin-bottom: 10px;
            text-shadow: 0 2px 17px rgba(0,0,0,0.5);
        }

        .gen-section-header { 
            font-size: 0.75rem; 
            text-transform: uppercase; 
            color: #8b75af;
            font-weight: 800; 
            margin-top: 15px; 
            letter-spacing: 0.1em;
            padding-left: 5px;
        }

        .gen-form-group label { 
            display: block; 
            margin-bottom: 5px; 
            font-size: 0.85rem; 
            color: #3bcaad;
            font-weight: 500; 
            padding-left: 5px;
        }

        /* Glass Inputs */
        .gen-form-group input { 
            width: 100%; 
            padding: 12px 16px; 
            /* Subtle dark glass for inputs */
            background: rgba(0, 0, 0, 0.2); 
            border: 1px solid rgba(255, 255, 255, 0.1); 
            border-radius: 12px; 
            font-size: 14px; 
            color: #fff;
            transition: all 0.2s ease;
        }

        .gen-form-group input:focus { 
            border-color: #ffffff;
            outline: none; 
            background: rgba(0, 0, 0, 0.4);
            box-shadow: 0 0 0 2px rgba(129, 140, 248, 0.35); 
        }
        
        .gen-custom-file-btn { 
            background: rgba(255, 255, 255, 0.05); 
            border: 1px dashed rgba(255, 255, 255, 0.3); 
            color: #e2e8f0; 
            padding: 10px; 
            text-align: center; 
            border-radius: 12px; 
            cursor: pointer; 
            font-size: 0.85rem; 
            width: 100%; 
            display: block; 
            transition: all 0.2s;
        }
        .gen-custom-file-btn:hover { 
            background: rgba(255, 255, 255, 0.1); 
            border-color: #fff;
        }

        /* --- NEW GLASS BUTTON --- */
        button.gen-print-btn { 
            margin-top: 20px;
            width: 100%; 
            padding: 16px; 
            font-size: 1rem; 
            font-weight: bold; 
            cursor: pointer; 
            
            /* Whitish Glass Gradient */
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05));
            border: 1px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            border-radius: 9999px; /* Fully rounded */
            color: white;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
            
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            transition: transform 0.2s, background 0.2s;
        }

        button.gen-print-btn:hover { 
            transform: scale(1.02); 
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.1));
            border-color: rgba(255, 255, 255, 0.4);
        }

        /* --- A4 PAPER (Right Side) --- */
        .gen-page-container {
            width: 210mm;
            min-height: 297mm;
            background: white;
            /* Deep shadow for pop effect */
            box-shadow: 0 20px 60px rgba(0,0,0,0.6); 
            padding: 45px 55px;
            box-sizing: border-box;
            position: relative;
        }

        /* [REST OF PAPER STYLES REMAIN SAME AS THEY ARE STANDARD PRINT STYLES] */
        .gen-document-content { font-family: 'Tinos', serif; color: #000; line-height: 1.3; }
        .gen-uni-header { text-align: center; }
        .gen-uni-name { font-size: 26pt; font-weight: bold; color: #000; margin-bottom: 10px; }
        .gen-uni-address { font-size: 16pt; margin-bottom: 25px; }
        .gen-logo-container { text-align: center; margin: 20px 0 40px 0; height: 160px; display: flex; align-items: center; justify-content: center; }
        .gen-logo-img { max-width: 200px; max-height: 200px; }
        .gen-assignment-type { text-align: center; font-size: 24pt; font-weight: bold; margin: 30px 0 50px 0; color: #000; }
        .gen-course-info { margin-bottom: 50px; padding-left: 20px; }
        .gen-info-row { display: flex; margin-bottom: 12px; font-size: 16pt; }
        .gen-info-label { width: 210px; font-weight: bold; }
        .gen-info-val { flex: 1; }
        .gen-submission-box { border: 2px solid #193a04; display: flex; min-height: 320px; }
        .gen-box-col { padding: 25px; flex: 1; display: flex; flex-direction: column; }
        .gen-box-left { border-right: 2px solid #000; }
        .gen-box-title { font-size: 18pt; font-weight: bold; margin-bottom: 25px; display: block; }
        .gen-detail-text { font-size: 16pt; margin-bottom: 8px; line-height: 1.4; }
        .gen-bold-text { font-weight: bold; }
        .gen-footer-text { margin-top: auto; font-size: 13pt; }

        @media screen and (max-width: 900px) {
            .gen-root { flex-direction: column; align-items: center; padding: 15px; padding-top: 80px; }
            .gen-controls { width: 100%; max-width: 100%; padding: 20px; }
            .gen-page-container { transform: scale(0.6); margin-bottom: -120mm; transform-origin: top center; }
        }
        @media screen and (max-width: 480px) {
            .gen-page-container { transform: scale(0.42); margin-bottom: -170mm; }
        }

        /* --- PRINT OVERRIDES (FIXED FOR 1 INCH MARGIN & MOBILE) --- */
        @media print {
            @page { 
                size: A4 portrait; 
                margin-top: 1in;
                margin-bottom: 0.5in;
                margin-left: 1in;
                margin-right: 0.5in; /* Strict 1 inch margin */
            }
            
            html, body { 
                width: 100%; 
                background-color: #fff !important; 
                margin: 0 !important; 
                padding: 0 !important; 
                overflow: visible !important; 
            }
            
            body * { visibility: hidden; }
            
            #cover-gen-root, #cover-gen-root * { visibility: visible; }
            
            #cover-gen-root { 
                position: relative; /* Fixed absolute positioning issue */
                left: 0; 
                top: 0; 
                background: white; 
                z-index: 9999;
                width: 100%;
                margin: 0;
                padding: 0;
                overflow: visible;
            }
            
            .gen-root { 
                display: block !important; 
                padding: 0 !important; 
                margin: 0 !important;
            }
            
            .gen-controls, .gen-close-btn { display: none !important; }
            
            .gen-page-container { 
                width: 100% !important; 
                max-width: 100% !important;
                height: auto !important; 
                margin: 0 !important; 
                /* Padding set to 0 because @page margin handles the 1in spacing */
                padding: 0 !important; 
                box-shadow: none !important; 
                /* Reset any screen scaling transforms */
                transform: none !important; 
                border: none !important;
            }
        }
    `;

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm overflow-auto animate-in fade-in" id="cover-gen-root">
            <style>{generatorStyles}</style>
            
            <button 
                onClick={onClose} 
                className="gen-close-btn fixed top-6 right-6 z-[110] bg-red-500/80 hover:bg-red-500 text-white p-3 rounded-full shadow-lg transition-transform hover:scale-110 backdrop-blur-md"
            >
                <IconClose />
            </button>

            <div className="gen-root">
                <div className="gen-controls">
                    <h2>Cover Generator</h2>
                    
                    <div className="text-xs text-center text-gray-400 mb-2 border border-white/10 rounded p-2 bg-black/20">
                        Customize your details below. Changes appear instantly on the preview.
                    </div>

                    <div style={{ position: 'relative', marginBottom: 10 }}>
                        <label htmlFor="logo-uploader" className="gen-custom-file-btn">📂 Upload Logo (Optional)</label>
                        <input type="file" id="logo-uploader" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                    </div>

                    <div className="gen-section-header">Variables</div>
                    <div className="gen-form-group"><label>Assignment Title</label><input type="text" value={formData.assignTitle} onChange={e => handleChange('assignTitle', e.target.value)} /></div>
                    <div className="gen-form-group"><label>Course Title</label><input type="text" value={formData.courseTitle} onChange={e => handleChange('courseTitle', e.target.value)} /></div>
                    <div className="gen-form-group"><label>Course Code</label><input type="text" value={formData.courseCode} onChange={e => handleChange('courseCode', e.target.value)} /></div>
                    <div className="gen-form-group"><label>Submission Date</label><input type="text" value={formData.date} placeholder="DD Month YYYY" onChange={e => handleChange('date', e.target.value)} /></div>

                    <div className="gen-section-header">Submitted By</div>
                    <div className="gen-form-group"><label>Student Name</label><input type="text" value={formData.name} onChange={e => handleChange('name', e.target.value)} /></div>
                    <div className="gen-form-group"><label>Registration No.</label><input type="text" value={formData.reg} onChange={e => handleChange('reg', e.target.value)} /></div>
                    <div className="gen-form-group"><label>Level / Semester</label><input type="text" value={formData.level} onChange={e => handleChange('level', e.target.value)} /></div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <div className="gen-form-group" style={{ flex: 1 }}><label>Section</label><input type="text" value={formData.sec} onChange={e => handleChange('sec', e.target.value)} /></div>
                        <div className="gen-form-group" style={{ flex: 1 }}><label>Group</label><input type="text" value={formData.group} onChange={e => handleChange('group', e.target.value)} /></div>
                    </div>
                    <div className="gen-form-group"><label>Faculty</label><input type="text" value={formData.faculty} onChange={e => handleChange('faculty', e.target.value)} /></div>

                    <div className="gen-section-header">Submitted To</div>
                    <div className="gen-form-group"><label>Teacher's Name</label><input type="text" value={formData.tname} onChange={e => handleChange('tname', e.target.value)} /></div>
                    <div className="gen-form-group"><label>Designation</label><input type="text" value={formData.desig} onChange={e => handleChange('desig', e.target.value)} /></div>
                    <div className="gen-form-group"><label>Department</label><input type="text" value={formData.dept} onChange={e => handleChange('dept', e.target.value)} /></div>

                    <button className="gen-print-btn" onClick={handlePrint}><IconPrint /> Download PDF / Print</button>
                </div>

                <div className="gen-page-container">
                    <div className="gen-document-content">
                        <div className="gen-uni-header">
                            <div className="gen-uni-name">Sher-e-Bangla Agricultural University</div>
                            <div className="gen-uni-address">Sher-e-Bangla Nagar, Dhaka-1207</div>
                        </div>

                        <div className="gen-logo-container">
                       <img 
                          src={logo} 
                          alt="SAU Logo" 
                          style={{ width: '150px', height: 'auto', objectFit: 'contain', maxHeight: '160px' }} 
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                            
                            <svg width="140" height="180" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" style={{ display: logo ? 'none' : 'block' }} className={logo ? 'hidden' : ''}>
                                <path d="M10,10 L90,10 L90,40 C90,80 50,110 50,110 C50,110 10,80 10,40 Z" fill="#FCEEA7" stroke="#000" strokeWidth="2"/>
                                <circle cx="50" cy="45" r="25" fill="#FFF" stroke="#2F8488" strokeWidth="2" strokeDasharray="4,2"/>
                                <circle cx="50" cy="35" r="10" fill="#E13227"/>
                                <path d="M30,70 L50,80 L70,70 L70,90 L50,100 L30,90 Z" fill="#FFF" stroke="#000" strokeWidth="1.5"/>
                                <text x="50" y="105" fontFamily="Arial" fontSize="6" textAnchor="middle" fontWeight="bold">UNIVERSITY</text>
                            </svg>
                        </div>

                        <div className="gen-assignment-type">{formData.assignTitle}</div>

                        <div className="gen-course-info">
                            <div className="gen-info-row"><span className="gen-info-label">Course Title</span><span className="gen-info-val">: {formData.courseTitle}</span></div>
                            <div className="gen-info-row"><span className="gen-info-label">Course Code</span><span className="gen-info-val">: {formData.courseCode}</span></div>
                            <div className="gen-info-row"><span className="gen-info-label">Date of Submission</span><span className="gen-info-val">: {formData.date}</span></div>
                        </div>

                        <div className="gen-submission-box">
                            <div className="gen-box-col gen-box-left">
                                <span className="gen-box-title">Submitted By:</span>
                                <div className="gen-detail-text gen-bold-text">{formData.name}</div>
                                <div className="gen-detail-text"><span className="gen-bold-text">Reg:</span> {formData.reg}</div>
                                <div className="gen-detail-text">{formData.level}</div>
                                <div className="gen-detail-text">Section {formData.sec}, Group- {formData.group}</div>
                                <div className="gen-footer-text">{formData.faculty}</div>
                            </div>

                            <div className="gen-box-col gen-box-right">
                                <span className="gen-box-title">Submitted To:</span>
                                <div className="gen-detail-text gen-bold-text" style={{ textTransform: '' }}>{formData.tname}</div>
                                <div className="gen-detail-text" style={{ fontStyle: 'italic' }}>{formData.desig}</div>
                                <div className="gen-detail-text">{formData.dept}</div>
                                <div className="gen-footer-text">Sher-e-Bangla Agricultural<br/>University, Dhaka-1207</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};