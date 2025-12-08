import { useState } from 'react';
import { ragService } from '@/services/ragService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Database, Search, Zap, MessageSquare, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

const RAGTest = () => {
  const [status, setStatus] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isStoring, setIsStoring] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Form states
  const [textToStore, setTextToStore] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [storeResult, setStoreResult] = useState<any>(null);
  const [quickTestResult, setQuickTestResult] = useState<any>(null);

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const result = await ragService.checkStatus();
      setStatus(result);
      toast.success('Status checked successfully');
    } catch (error: any) {
      toast.error('Failed to check status: ' + (error.response?.data?.detail || error.message));
      console.error('Status check error:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const runQuickTest = async () => {
    setIsTesting(true);
    try {
      const result = await ragService.quickTest();
      toast.success('Quick test completed successfully!');
      console.log('Quick test result:', result);
      setQuickTestResult(result);
    } catch (error: any) {
      toast.error('Quick test failed: ' + (error.response?.data?.detail || error.message));
      console.error('Quick test error:', error);
    } finally {
      setIsTesting(false);
    }
  };

  const storeEmbedding = async () => {
    if (!textToStore.trim()) {
      toast.error('Please enter text to store');
      return;
    }

    setIsStoring(true);
    try {
      const result = await ragService.storeEmbedding({
        text: textToStore,
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'manual_entry',
        },
      });
      setStoreResult(result);
      toast.success('Text stored successfully!');
      console.log('Store result:', result);
    } catch (error: any) {
      toast.error('Failed to store: ' + (error.response?.data?.detail || error.message));
      console.error('Store error:', error);
    } finally {
      setIsStoring(false);
    }
  };

  const searchSimilar = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsSearching(true);
    try {
      const result = await ragService.search({
        query: searchQuery,
        top_k: 5,
      });
      setSearchResults(result);
      toast.success(`Found ${result.matches?.length || 0} results`);
      console.log('Search results:', result);
    } catch (error: any) {
      toast.error('Search failed: ' + (error.response?.data?.detail || error.message));
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">RAG System Test</h1>
          <p className="text-muted-foreground mt-2">
            Test the Pinecone + OpenAI integration for Retrieval-Augmented Generation
          </p>
        </div>
      </div>

      {/* Status Check */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            System Status
          </CardTitle>
          <CardDescription>Check if OpenAI and Pinecone are configured correctly</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={checkStatus} disabled={isChecking}>
            {isChecking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              'Check Status'
            )}
          </Button>

          {status && (
            <div className="space-y-3 mt-4">
              <Alert>
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">OpenAI:</span>
                      {status.credentials.openai_configured ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Configured
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Not Configured
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Pinecone:</span>
                      {status.credentials.pinecone_configured ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Configured
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Not Configured
                        </Badge>
                      )}
                    </div>
                    {status.pinecone?.index_exists !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Index Status:</span>
                        {status.pinecone.index_exists ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Exists ({status.pinecone.index_name})
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            Index Not Created
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick End-to-End Test
          </CardTitle>
          <CardDescription>
            Runs a complete test: stores a sample document and searches for it
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runQuickTest} disabled={isTesting}>
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Test...
              </>
            ) : (
              'Run Quick Test'
            )}
          </Button>

          {quickTestResult && (
            <div className="space-y-4 mt-4">
              <Alert className="bg-green-50 dark:bg-green-900/20 border-green-500">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription>
                  <div className="font-semibold text-green-700 dark:text-green-400">
                    ✓ Quick Test Completed Successfully
                  </div>
                </AlertDescription>
              </Alert>

              {/* Store Result */}
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Step 1: Store Document
                </h4>
                <Alert>
                  <AlertDescription>
                    <div className="space-y-1 text-sm">
                      <div><span className="font-semibold">Vector ID:</span> {quickTestResult.store_result?.vector_id}</div>
                      <div><span className="font-semibold">Text:</span> {quickTestResult.store_result?.text}</div>
                      <div><span className="font-semibold">Status:</span> <Badge variant="default" className="bg-green-500">Stored Successfully</Badge></div>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>

              {/* Search Result */}
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Step 2: Search Results
                </h4>
                {quickTestResult.search_result?.matches && quickTestResult.search_result.matches.length > 0 ? (
                  <div className="space-y-2">
                    {quickTestResult.search_result.matches.map((match: any, index: number) => (
                      <Alert key={index}>
                        <AlertDescription>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">Match {index + 1}</span>
                              <Badge>Similarity: {(match.score * 100).toFixed(2)}%</Badge>
                            </div>
                            <div><span className="font-semibold">ID:</span> {match.id}</div>
                            {match.metadata && (
                              <div className="bg-muted p-2 rounded mt-2">
                                <span className="font-semibold">Metadata:</span>
                                <pre className="text-xs mt-1">{JSON.stringify(match.metadata, null, 2)}</pre>
                              </div>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <AlertDescription>No results found</AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Summary */}
              <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-500">
                <AlertDescription>
                  <div className="text-sm space-y-1">
                    <div className="font-semibold text-blue-700 dark:text-blue-400">Test Summary:</div>
                    <div>✓ Document stored in Pinecone vector database</div>
                    <div>✓ Embeddings generated using OpenAI</div>
                    <div>✓ Similarity search executed successfully</div>
                    <div>✓ Found {quickTestResult.search_result?.matches?.length || 0} matching vectors</div>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Store Embedding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Store Text Embedding
          </CardTitle>
          <CardDescription>Store text in Pinecone vector database</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="text-to-store">Text to Store</Label>
            <Textarea
              id="text-to-store"
              placeholder="Enter text to store as an embedding..."
              value={textToStore}
              onChange={(e) => setTextToStore(e.target.value)}
              rows={4}
            />
          </div>
          <Button onClick={storeEmbedding} disabled={isStoring}>
            {isStoring ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Storing...
              </>
            ) : (
              'Store Embedding'
            )}
          </Button>

          {storeResult && (
            <Alert>
              <AlertDescription>
                <pre className="text-sm overflow-auto">{JSON.stringify(storeResult, null, 2)}</pre>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* RAG Demo: Question-Answer Workflow */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            RAG Demo: Ask a Question
          </CardTitle>
          <CardDescription>
            See how RAG works: Store knowledge, ask questions, and get relevant context
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Example Knowledge Base */}
          <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-500">
            <BookOpen className="h-4 w-4 text-blue-500" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-semibold text-blue-700 dark:text-blue-400">How RAG Works:</div>
                <ol className="text-sm space-y-1 ml-4 list-decimal">
                  <li>Store documents/knowledge in the vector database (below)</li>
                  <li>User asks a question (search query)</li>
                  <li>System finds most relevant stored content using similarity search</li>
                  <li>AI uses this context to generate accurate answers</li>
                </ol>
              </div>
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Store Knowledge */}
            <div className="space-y-2">
              <Label htmlFor="demo-store">Step 1: Store Knowledge</Label>
              <Textarea
                id="demo-store"
                placeholder="Example: Python is a programming language created by Guido van Rossum in 1991. It emphasizes code readability and simplicity."
                value={textToStore}
                onChange={(e) => setTextToStore(e.target.value)}
                rows={5}
              />
              <Button onClick={storeEmbedding} disabled={isStoring} className="w-full">
                {isStoring ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Storing...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Store in Vector DB
                  </>
                )}
              </Button>
            </div>

            {/* Ask Question */}
            <div className="space-y-2">
              <Label htmlFor="demo-question">Step 2: Ask a Question</Label>
              <Textarea
                id="demo-question"
                placeholder="Example: Who created Python?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                rows={5}
              />
              <Button onClick={searchSimilar} disabled={isSearching} className="w-full">
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Find Relevant Context
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Results Display */}
          {(storeResult || searchResults) && (
            <div className="space-y-4 pt-4 border-t">
              {storeResult && (
                <Alert className="bg-green-50 dark:bg-green-900/20 border-green-500">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <div className="font-semibold text-green-700 dark:text-green-400">
                        ✓ Knowledge Stored Successfully
                      </div>
                      <div className="text-sm">
                        <span className="font-semibold">Vector ID:</span> {storeResult.vector_id}
                      </div>
                      <div className="text-sm">
                        <span className="font-semibold">Text:</span> {storeResult.text}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {searchResults && (
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Step 3: Retrieved Context (What AI Will Use)
                  </h3>
                  {searchResults.matches && searchResults.matches.length > 0 ? (
                    <div className="space-y-2">
                      {searchResults.matches.map((match: any, index: number) => (
                        <Alert key={index} className="bg-purple-50 dark:bg-purple-900/20 border-purple-500">
                          <AlertDescription>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-purple-700 dark:text-purple-400">
                                  Relevant Context #{index + 1}
                                </span>
                                <Badge className="bg-purple-500">
                                  Relevance: {(match.score * 100).toFixed(1)}%
                                </Badge>
                              </div>

                              {/* Display the actual stored text */}
                              {(match.text || match.metadata?.text) ? (
                                <div className="bg-white dark:bg-gray-800 p-3 rounded border border-purple-300 dark:border-purple-700">
                                  <div className="font-semibold mb-2 text-purple-700 dark:text-purple-400">
                                    📄 Retrieved Text:
                                  </div>
                                  <div className="text-sm leading-relaxed">
                                    {match.text || match.metadata.text}
                                  </div>
                                </div>
                              ) : (
                                <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500">
                                  <AlertDescription className="text-sm">
                                    ⚠️ Text content not available. This vector was stored without text metadata.
                                  </AlertDescription>
                                </Alert>
                              )}

                              <div className="text-xs text-muted-foreground">
                                <span className="font-semibold">Vector ID:</span> {match.id}
                              </div>

                              {match.metadata && Object.keys(match.metadata).length > 1 && (
                                <details className="text-xs">
                                  <summary className="cursor-pointer font-semibold text-muted-foreground hover:text-foreground">
                                    View Full Metadata
                                  </summary>
                                  <div className="bg-muted p-2 rounded mt-2">
                                    <pre className="text-xs whitespace-pre-wrap overflow-auto">
                                      {JSON.stringify(match.metadata, null, 2)}
                                    </pre>
                                  </div>
                                </details>
                              )}
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))}

                      {/* Explanation */}
                      <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-500">
                        <AlertDescription>
                          <div className="text-sm space-y-1">
                            <div className="font-semibold text-blue-700 dark:text-blue-400">
                              💡 How This Helps:
                            </div>
                            <div>
                              The AI assistant would use these {searchResults.matches.length} most relevant
                              piece(s) of stored knowledge to answer the user's question accurately and with
                              proper context. This is the "Retrieval" part of RAG (Retrieval-Augmented Generation).
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    </div>
                  ) : (
                    <Alert>
                      <AlertDescription>
                        No relevant context found. Try storing some knowledge first!
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RAGTest;
