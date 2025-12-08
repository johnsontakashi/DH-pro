import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AIAssistant from '@/components/AIAssistant';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, BookOpen } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

interface Subject {
  id: number;
  name: string;
  code: string;
  chapters: Chapter[];
}

interface Chapter {
  id: number;
  name: string;
  order: number;
}

const AIChat: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialChapterId = searchParams.get('chapterId');

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedChapterId, setSelectedChapterId] = useState<string>(initialChapterId || '');
  const [selectedChapterName, setSelectedChapterName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    if (initialChapterId && subjects.length > 0) {
      // Find the chapter and set subject
      for (const subject of subjects) {
        const chapter = subject.chapters.find((c) => c.id === parseInt(initialChapterId));
        if (chapter) {
          setSelectedSubjectId(subject.id.toString());
          setSelectedChapterId(initialChapterId);
          setSelectedChapterName(`${subject.name} - ${chapter.name}`);
          break;
        }
      }
    }
  }, [initialChapterId, subjects]);

  const loadSubjects = async () => {
    try {
      const response = await api.get('/subjects');
      setSubjects(response.data.subjects);
    } catch (error) {
      toast.error(t('messages.failedToLoadSubjects'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectChange = (value: string) => {
    setSelectedSubjectId(value);
    setSelectedChapterId('');
    setSelectedChapterName('');
  };

  const handleChapterChange = (value: string) => {
    setSelectedChapterId(value);

    // Find chapter name
    const subject = subjects.find((s) => s.id === parseInt(selectedSubjectId));
    if (subject) {
      const chapter = subject.chapters.find((c) => c.id === parseInt(value));
      if (chapter) {
        setSelectedChapterName(`${subject.name} - ${chapter.name}`);
      }
    }
  };

  const selectedSubject = subjects.find((s) => s.id === parseInt(selectedSubjectId));

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-[600px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('messages.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Brain className="w-8 h-8 text-purple-500" />
        <div>
          <h1 className="text-3xl font-bold">{t('aiChat.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('aiChat.subtitle')}</p>
        </div>
      </div>

      {/* Chapter Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {t('aiChat.selectChapterOptional')}
          </CardTitle>
          <CardDescription>{t('aiChat.selectChapterDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('aiChat.subjectLabel')}</label>
              <Select value={selectedSubjectId} onValueChange={handleSubjectChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t('aiChat.selectSubjectPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">{t('aiChat.chapterLabel')}</label>
              <Select value={selectedChapterId} onValueChange={handleChapterChange} disabled={!selectedSubjectId}>
                <SelectTrigger>
                  <SelectValue placeholder={selectedSubjectId ? t('aiChat.selectChapterPlaceholder') : t('aiChat.selectSubjectFirst')} />
                </SelectTrigger>
                <SelectContent>
                  {selectedSubject?.chapters.map((chapter) => (
                    <SelectItem key={chapter.id} value={chapter.id.toString()}>
                      {chapter.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Assistant */}
      <div className="h-[600px]">
        <AIAssistant chapterId={selectedChapterId ? parseInt(selectedChapterId) : undefined} chapterName={selectedChapterName} />
      </div>

      {/* Features Info */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3">{t('aiChat.assistantCapabilities')}</h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-0.5">•</span>
              <span>{t('aiChat.capability1')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-0.5">•</span>
              <span>{t('aiChat.capability2')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-0.5">•</span>
              <span>{t('aiChat.capability3')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-0.5">•</span>
              <span>{t('aiChat.capability4')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-0.5">•</span>
              <span>{t('aiChat.capability5')}</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIChat;
