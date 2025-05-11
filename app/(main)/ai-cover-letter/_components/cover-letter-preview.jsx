"use client";

import React, { useState } from "react";
import MDEditor from "@uiw/react-md-editor";
import { Button } from "@/components/ui/button";
import { Edit2, Download, Save, X } from "lucide-react";
import { updateCoverLetter } from "@/actions/cover-letter";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import 'jspdf-autotable';

const CoverLetterPreview = ({ content, id }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const router = useRouter();

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      await updateCoverLetter(id, editedContent);
      toast.success("Cover letter updated successfully!");
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      toast.error("Failed to update cover letter");
    }
  };

  const handleDownload = () => {
    try {
      // Create new PDF document with standard fonts
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: 'letter',
        putOnlyUsedFonts: true
      });
      
      // Use standard font
      doc.setFont('helvetica');
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0); // Black color
      
      // Process content for proper line breaks
      // First, normalize line breaks
      let processedContent = editedContent
        .replace(/\r\n/g, '\n')  // Normalize Windows line breaks
        .replace(/\n\n+/g, '\n\n')  // Replace multiple blank lines with just one
        .trim();
      
      // Split by paragraphs (double line breaks)
      const paragraphs = processedContent.split('\n\n');
      
      // Clean each paragraph of markdown syntax
      const cleanParagraphs = paragraphs.map(paragraph => {
        return paragraph
          .replace(/^#+\s+/gm, '') // Remove headings
          .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
          .replace(/\*(.*?)\*/g, '$1') // Remove italic
          .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links
          .replace(/```.*?```/gs, '') // Remove code blocks
          .trim();
      }).filter(para => para.length > 0);
      
      // Add content to PDF with proper spacing
      let y = 1.0; // Starting y position
      let lineHeight = 0.2; // Height of each line
      let paragraphSpacing = 0.15; // Extra space between paragraphs
      
      cleanParagraphs.forEach(paragraph => {
        // Split paragraph into lines that fit the page width
        const splitText = doc.splitTextToSize(paragraph, 6.5); // 8.5 - 2 for margins
        
        // Check if we need a new page
        if (y + (splitText.length * lineHeight) > 10) { // 11 - 1 for bottom margin
          doc.addPage();
          y = 1.0;
        }
        
        // Add text
        doc.text(splitText, 1.0, y);
        
        // Move y position for next paragraph
        y += (splitText.length * lineHeight) + paragraphSpacing;
      });
      
      // Save PDF
      doc.save('cover-letter.pdf');
      
      toast.success("Cover letter downloaded as PDF");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <div className="py-4 space-y-4">
      <div className="flex justify-end space-x-2">
        {isEditing ? (
          <>
            <Button variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button variant="default" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={handleEdit}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="default" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download as PDF
            </Button>
          </>
        )}
      </div>
      
      {isEditing ? (
        <MDEditor
          value={editedContent}
          onChange={setEditedContent}
          height={700}
        />
      ) : (
        <MDEditor value={content} preview="preview" height={700} />
      )}
    </div>
  );
};

export default CoverLetterPreview;
