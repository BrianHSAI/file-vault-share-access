
import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileItem } from "@/context/FileContext";
import { File, Trash } from "lucide-react";

interface FileCardProps {
  file: FileItem;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

const FileCard: React.FC<FileCardProps> = ({ file, onDelete, onView }) => {
  const usedCodes = file.accessCodes.filter((code) => code.used).length;
  const totalCodes = file.accessCodes.length;

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center gap-2 overflow-hidden">
            <File size={20} className="text-blue-600" />
            <span className="truncate text-lg">{file.name}</span>
          </div>
        </CardTitle>
        <p className="text-sm text-gray-500">Uploaded on {file.uploadDate}</p>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid gap-1">
          <div className="text-sm">
            <span className="font-medium">Size:</span> {file.size}
          </div>
          <div className="text-sm">
            <span className="font-medium">Access codes:</span> {usedCodes}/{totalCodes} used
          </div>
          <div className="mt-2">
            <p className="text-xs text-gray-500 mb-1">Access codes:</p>
            <div className="flex flex-wrap gap-1">
              {file.accessCodes.map((code, index) => (
                <span 
                  key={index}
                  className={`text-xs px-2 py-1 rounded ${
                    code.used 
                      ? "bg-gray-200 text-gray-500" 
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {code.code} {code.used && "(used)"}
                </span>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button variant="outline" size="sm" onClick={() => onView(file.id)}>
          View
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-red-600 hover:bg-red-50"
          onClick={() => onDelete(file.id)}
        >
          <Trash size={16} />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FileCard;
