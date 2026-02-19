import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PlayCircle, ExternalLink } from 'lucide-react';
import { ProgramPiece } from '@/types/bagrut.types';

interface ProgramTableProps {
  program: ProgramPiece[];
  onUpdate: (program: ProgramPiece[]) => void;
  readonly?: boolean;
}

export const ProgramTable: React.FC<ProgramTableProps> = ({
  program,
  onUpdate,
  readonly = false,
}) => {
  const [pieces, setPieces] = useState<ProgramPiece[]>(() => {
    const initialPieces = [...program];
    while (initialPieces.length < 5) {
      initialPieces.push({
        pieceTitle: '',
        composer: '',
        duration: '',
        movement: '',
        youtubeLink: '',
      });
    }
    return initialPieces.slice(0, 5);
  });

  const validateYouTubeUrl = (url: string) => {
    if (!url) return true;
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/).+/;
    return youtubeRegex.test(url);
  };

  const updatePiece = (index: number, field: keyof ProgramPiece, value: string) => {
    const updatedPieces = [...pieces];
    updatedPieces[index] = {
      ...updatedPieces[index],
      [field]: value,
    };
    setPieces(updatedPieces);
    
    const validPieces = updatedPieces.filter(
      (piece) => piece.pieceTitle && piece.composer && piece.duration && piece.movement
    );
    onUpdate(validPieces);
  };

  const getTotalDuration = () => {
    const validPieces = pieces.filter(piece => piece.duration);
    const totalSeconds = validPieces.reduce((total, piece) => {
      const parts = piece.duration.split(':');
      if (parts.length === 2) {
        return total + parseInt(parts[0]) * 60 + parseInt(parts[1]);
      }
      return total;
    }, 0);
    
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getValidPieceCount = () => {
    return pieces.filter(piece => 
      piece.pieceTitle && piece.composer && piece.duration && piece.movement
    ).length;
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">תוכנית הרסיטל</h2>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>יצירות מוגדרות: {getValidPieceCount()}/5</span>
          <span>זמן כולל: {getTotalDuration()}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-4 py-3 text-right font-semibold">
                מס' יצירה
              </th>
              <th className="border border-gray-300 px-4 py-3 text-right font-semibold">
                שם המלחין
              </th>
              <th className="border border-gray-300 px-4 py-3 text-right font-semibold">
                שם היצירה
              </th>
              <th className="border border-gray-300 px-4 py-3 text-right font-semibold">
                פרק/סולם *
              </th>
              <th className="border border-gray-300 px-4 py-3 text-right font-semibold">
                משך זמן
              </th>
              <th className="border border-gray-300 px-4 py-3 text-right font-semibold">
                קישור YouTube
              </th>
            </tr>
          </thead>
          <tbody>
            {pieces.map((piece, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 text-center font-semibold">
                  {index + 1}
                </td>
                <td className="border border-gray-300 px-2 py-2">
                  <Input
                    value={piece.composer}
                    onChange={(e) => updatePiece(index, 'composer', e.target.value)}
                    placeholder="שם המלחין"
                    disabled={readonly}
                    className="border-0 focus:ring-1 focus:ring-blue-500 text-right"
                    dir="rtl"
                  />
                </td>
                <td className="border border-gray-300 px-2 py-2">
                  <Input
                    value={piece.pieceTitle}
                    onChange={(e) => updatePiece(index, 'pieceTitle', e.target.value)}
                    placeholder="שם היצירה"
                    disabled={readonly}
                    className="border-0 focus:ring-1 focus:ring-blue-500 text-right"
                    dir="rtl"
                  />
                </td>
                <td className="border border-gray-300 px-2 py-2">
                  <Input
                    value={piece.movement || ''}
                    onChange={(e) => updatePiece(index, 'movement', e.target.value)}
                    placeholder="פרק ראשון / דו מז'ור"
                    disabled={readonly}
                    className={`border-0 focus:ring-1 text-right ${
                      !piece.movement && piece.pieceTitle
                        ? 'focus:ring-red-500 bg-red-50'
                        : 'focus:ring-blue-500'
                    }`}
                    dir="rtl"
                    required
                  />
                  {!piece.movement && piece.pieceTitle && (
                    <div className="text-xs text-red-600 mt-1">שדה חובה</div>
                  )}
                </td>
                <td className="border border-gray-300 px-2 py-2">
                  <Input
                    value={piece.duration}
                    onChange={(e) => updatePiece(index, 'duration', e.target.value)}
                    placeholder="5:30"
                    disabled={readonly}
                    className="border-0 focus:ring-1 focus:ring-blue-500 text-center"
                    pattern="[0-9]+:[0-9]{2}"
                  />
                </td>
                <td className="border border-gray-300 px-2 py-2">
                  <div className="flex items-center gap-2">
                    <Input
                      value={piece.youtubeLink || ''}
                      onChange={(e) => updatePiece(index, 'youtubeLink', e.target.value)}
                      placeholder="https://youtu.be/..."
                      disabled={readonly}
                      className={`border-0 focus:ring-1 text-left flex-1 ${
                        piece.youtubeLink && !validateYouTubeUrl(piece.youtubeLink)
                          ? 'focus:ring-red-500 bg-red-50'
                          : 'focus:ring-blue-500'
                      }`}
                      dir="ltr"
                    />
                    {piece.youtubeLink && validateYouTubeUrl(piece.youtubeLink) && (
                      <a
                        href={piece.youtubeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-600 hover:text-red-800 flex-shrink-0"
                      >
                        <PlayCircle className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                  {piece.youtubeLink && !validateYouTubeUrl(piece.youtubeLink) && (
                    <div className="text-xs text-red-600 mt-1">קישור לא תקין</div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold text-blue-900 mb-2">הנחיות לתוכנית הרסיטל:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• יש למלא בדיוק 5 יצירות</li>
          <li>• פרק/סולם הוא שדה חובה לכל יצירה</li>
          <li>• יש לציין את הפרק הספציפי (למשל: "פרק ראשון", "אלגרו") או הסולם</li>
          <li>• זמן מינימלי כולל: 15 דקות</li>
          <li>• קישורי YouTube מומלצים לכל יצירה</li>
          <li>• תלמידי 5 יחידות: לפחות יצירה אחת חייבת להיות בעל פה</li>
        </ul>
      </div>

      {!readonly && (
        <div className="mt-4 flex justify-end">
          <Button
            onClick={() => {
              const validPieces = pieces.filter(piece => 
                piece.pieceTitle && piece.composer && piece.duration && piece.movement
              );
              onUpdate(validPieces);
            }}
            disabled={getValidPieceCount() === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            שמור תוכנית
          </Button>
        </div>
      )}
    </Card>
  );
};

export default ProgramTable;