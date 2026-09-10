import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, Upload, Sparkles, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { AVAILABLE_MODELS, type ModelStatus, saveModelStatus, getCachedModelStatuses } from '@/lib/model-manager'
import { initLLM, initWhisper, runFullPipeline, disposeAll } from '@/lib/browser-pipeline'

const MODEL_MAP: Record<string, string> = {
  'qwen2.5-0.5b': 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC',
  'whisper-tiny': 'Xenova/whisper-tiny',
}

interface Model {
  id: string
  name: string
  type: 'llm' | 'whisper'
  status: ModelStatus
  progress: number
}

interface Clip {
  id: number
  title: string
  score: number
  hook: string
  reason: string
  startTime: string
  endTime: string
  duration: string
  videoUrl: string
}

export default function App() {
  const [models, setModels] = useState<Model[]>(() => {
    const cached = getCachedModelStatuses()
    return AVAILABLE_MODELS.map(m => ({
      id: m.id,
      name: m.name,
      type: m.type,
      status: cached[m.id]?.status === 'ready' ? 'ready' : 'not_downloaded',
      progress: 0,
    }))
  })
  const [downloading, setDownloading] = useState(false)
  const [modelsReady, setModelsReady] = useState(false)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [numClips, setNumClips] = useState(3)
  const [aspectRatio, setAspectRatio] = useState('9:16')
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')
  const [results, setResults] = useState<Clip[]>([])
  const [error, setError] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const downloadModel = async (modelId: string) => {
    const model = models.find(m => m.id === modelId)
    if (!model || model.status === 'ready') return

    setModels(prev => prev.map(m => m.id === modelId ? { ...m, status: 'downloading', progress: 0 } : m))

    try {
      if (model.type === 'llm') {
        await initLLM(MODEL_MAP[modelId], (p) => {
          setModels(prev => prev.map(m => m.id === modelId ? { ...m, progress: p.progress } : m))
        })
      } else if (model.type === 'whisper') {
        await initWhisper(MODEL_MAP[modelId], (p) => {
          setModels(prev => prev.map(m => m.id === modelId ? { ...m, progress: p.progress } : m))
        })
      }

      setModels(prev => prev.map(m => m.id === modelId ? { ...m, status: 'ready', progress: 100 } : m))
      saveModelStatus(modelId, 'ready')
    } catch (e) {
      setModels(prev => prev.map(m => m.id === modelId ? { ...m, status: 'error', progress: 0 } : m))
      throw e
    }
  }

  const downloadAll = async () => {
    setDownloading(true)
    setDownloadError(null)
    try {
      for (const id of ['whisper-tiny', 'qwen2.5-0.5b']) {
        await downloadModel(id)
      }
      setModelsReady(true)
    } catch (e) {
      console.error('Download failed:', e)
      setDownloadError((e as Error).message)
    } finally {
      setDownloading(false)
    }
  }

  const handleGenerate = async () => {
    if (!videoFile || !modelsReady) return

    setProcessing(true)
    setProgress(0)
    setError(null)
    setResults([])

    try {
      const result = await runFullPipeline(
        videoFile,
        { numClips, aspectRatio },
        (p) => {
          setStatusMessage(p.message)
          if (p.step === 'init') setProgress(p.progress * 0.2)
          else if (p.step === 'extract') setProgress(20 + p.progress * 0.1)
          else if (p.step === 'transcribe') setProgress(30 + p.progress * 0.3)
          else if (p.step === 'detect') setProgress(60 + p.progress * 0.3)
          else if (p.step === 'crop') setProgress(90 + p.progress * 0.1)
        }
      )

      const clips: Clip[] = result.clips.map((clip, i) => ({
        id: i + 1,
        title: clip.highlight.title || `Highlight ${i + 1}`,
        score: clip.highlight.score || 50,
        hook: clip.highlight.hook || '',
        reason: clip.highlight.reason || '',
        startTime: formatTime(clip.highlight.start_time),
        endTime: formatTime(clip.highlight.end_time),
        duration: formatTime(clip.highlight.end_time - clip.highlight.start_time),
        videoUrl: clip.url,
      }))

      setResults(clips)
      setProgress(100)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setProcessing(false)
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const reset = () => {
    setResults([])
    setVideoFile(null)
    setProgress(0)
    setStatusMessage('')
    setError(null)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            <span className="font-semibold text-lg">ShortsAI</span>
          </div>
          {modelsReady && (
            <Badge variant="success" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Ready
            </Badge>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Models Section */}
        {!modelsReady && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Download AI Models
              </CardTitle>
              <CardDescription>
                One-time download (~500MB). Cached in your browser forever.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {models.map(model => (
                  <div key={model.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{model.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {model.type === 'llm' && 'Highlight Detection'}
                        {model.type === 'whisper' && 'Transcription'}
                      </div>
                      {model.status === 'downloading' && (
                        <Progress value={model.progress} className="mt-2 h-2" />
                      )}
                      {model.status === 'error' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => downloadModel(model.id)}
                        >
                          Retry
                        </Button>
                      )}
                    </div>
                    <div>
                      {model.status === 'ready' && (
                        <Badge variant="success">Ready</Badge>
                      )}
                      {model.status === 'downloading' && (
                        <Badge variant="secondary">{model.progress}%</Badge>
                      )}
                      {model.status === 'error' && (
                        <Badge variant="destructive">Error</Badge>
                      )}
                    </div>
                  </div>
                ))}
                <Button onClick={downloadAll} disabled={downloading} className="w-full" size="lg">
                  {downloading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download All Models
                    </>
                  )}
                </Button>
                {downloadError && (
                  <div className="p-4 border border-destructive rounded-lg bg-destructive/10 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-destructive">
                      <div className="font-medium mb-1">Download failed</div>
                      <div className="text-destructive/80">{downloadError}</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generator Section */}
        {modelsReady && results.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Generate Shorts
              </CardTitle>
              <CardDescription>
                Upload a video to create viral shorts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* File Upload */}
                <div>
                  <Label>Video File</Label>
                  <div className="mt-2">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                      className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                  </div>
                </div>

                {/* Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Number of Clips</Label>
                    <Select value={numClips.toString()} onValueChange={(v) => setNumClips(Number(v))}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map(n => (
                          <SelectItem key={n} value={n.toString()}>{n} clip{n > 1 ? 's' : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Aspect Ratio</Label>
                    <Select value={aspectRatio} onValueChange={setAspectRatio}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="9:16">9:16 (TikTok)</SelectItem>
                        <SelectItem value="1:1">1:1 (Square)</SelectItem>
                        <SelectItem value="4:5">4:5 (Instagram)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={!videoFile || processing}
                  className="w-full"
                  size="lg"
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Shorts
                    </>
                  )}
                </Button>

                {/* Progress */}
                {processing && (
                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <p className="text-sm text-muted-foreground text-center">{statusMessage}</p>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="p-4 border border-destructive rounded-lg bg-destructive/10 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-destructive">{error}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Generated Shorts</h2>
              <Button onClick={reset} variant="outline">
                New Video
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map(clip => (
                <Card key={clip.id} className="overflow-hidden">
                  <div className="aspect-[9/16] bg-muted">
                    <video src={clip.videoUrl} controls className="w-full h-full object-cover" />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary">#{clip.id}</Badge>
                      <Badge variant="success">Score: {clip.score}</Badge>
                    </div>
                    <h3 className="font-semibold text-sm mb-2">{clip.title}</h3>
                    {clip.hook && (
                      <p className="text-xs text-muted-foreground italic mb-2">"{clip.hook}"</p>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-muted-foreground">
                        {clip.startTime} → {clip.endTime}
                      </span>
                      <a
                        href={clip.videoUrl}
                        download={`short_${clip.id}.mp4`}
                        className="text-xs text-primary hover:underline"
                      >
                        Download
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
