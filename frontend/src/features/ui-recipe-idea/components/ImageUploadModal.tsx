/**
 * ImageUploadModal.tsx - 画像アップロードモーダル
 * 
 * 【目的】
 * カメラ撮影またはギャラリーからの画像選択機能を提供します。
 * 選択された画像をAI解析し、認識された食材を自動追加します。
 * 
 * 【機能】
 * - ギャラリーからの画像選択
 * - 複数画像の同時選択対応
 * - ローディング状態の表示
 * - エラーハンドリング
 */

'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Upload, Loader2, Camera, X, RotateCcw } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { compressCanvasImage } from '@/lib/utils/imageCompression';

// ===================================================================
// 型定義
// ===================================================================

/**
 * モーダルの表示モード
 */
type ModalMode = 'select' | 'camera' | 'preview';

/**
 * ImageUploadModalコンポーネントのプロパティ
 */
export interface ImageUploadModalProps {
  /** モーダルの表示状態 */
  isOpen: boolean;
  /** モーダルを閉じるコールバック */
  onClose: () => void;
  /** 画像選択完了時のコールバック */
  onImagesSelected: (files: FileList) => void;
  /** アップロード処理中かどうか */
  isUploading?: boolean;
  /** 最大ファイル数 */
  maxFiles?: number;
  /** 最大ファイルサイズ（MB） */
  maxSizeInMB?: number;
  /** 初期モード（モーダルを開いたら即選択/カメラ） */
  initialMode?: 'gallery' | 'camera';
}

// ===================================================================
// メインコンポーネント
// ===================================================================

/**
 * 画像アップロードモーダル
 * 
 * ユーザーが画像を選択してAI食材認識を実行するための
 * インターフェースを提供します。
 */
export default function ImageUploadModal({
  isOpen,
  onClose,
  onImagesSelected,
  isUploading = false,
  maxFiles = 5,
  maxSizeInMB = 10,
  initialMode,
}: ImageUploadModalProps) {
  
  // ===================================================================
  // 参照とローカル状態
  // ===================================================================
  
  /** ファイル入力の参照 */
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  /** ビデオ要素の参照 */
  const videoRef = useRef<HTMLVideoElement>(null);
  
  /** ビデオ状態監視用のタイマー */
  const videoMonitorRef = useRef<NodeJS.Timeout | null>(null);
  
  /** Canvas要素の参照 */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  /** モーダルの表示モード */
  const [mode, setMode] = useState<ModalMode>('select');
  
  /** カメラストリーム */
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  /** 撮影した画像データ */
  const [capturedImage, setCapturedImage] = useState<string>('');
  
  /** カメラ起動中のローディング状態 */
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  
  /** エラーメッセージ */
  const [error, setError] = useState<string>('');
  
  /**
   * HTTPS もしくは開発中のローカルネットワーク（プライベートIP）を許可
   */
  const isSecureContextOrDevLAN = useCallback((): boolean => {
    try {
      if (location.protocol === 'https:') return true;
      const host = location.hostname;
      if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return true;
      // 開発時のみプライベートIPを許可
      const isDev = process.env.NODE_ENV !== 'production';
      if (!isDev) return false;
      if (/^192\.168\./.test(host)) return true;
      if (/^10\./.test(host)) return true;
      const m = host.match(/^172\.(\d+)\./);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n >= 16 && n <= 31) return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);
  
  // ===================================================================
  // カメラ関連機能
  // ===================================================================
  
  /**
   * カメラデバイスの検出
   */
  const checkCameraDevices = useCallback(async (): Promise<{ hasCamera: boolean; devices: MediaDeviceInfo[] }> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return { hasCamera: false, devices: [] };
      }
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      console.log('利用可能なカメラデバイス:', videoDevices.length, videoDevices);
      
      return { 
        hasCamera: videoDevices.length > 0, 
        devices: videoDevices 
      };
    } catch (error) {
      console.warn('カメラデバイス検出エラー:', error);
      return { hasCamera: false, devices: [] };
    }
  }, []);

  /**
   * カメラAPIのサポート状況を詳細チェック
   */
  const checkCameraSupport = useCallback(async (): Promise<{ supported: boolean; error?: string; deviceInfo?: string }> => {
    // 基本的なAPI存在チェック
    if (!navigator.mediaDevices) {
      return { 
        supported: false, 
        error: 'お使いのブラウザはカメラ機能をサポートしていません。Chrome、Safari、Firefoxなどの最新ブラウザをご利用ください。' 
      };
    }

    if (!navigator.mediaDevices.getUserMedia) {
      return { 
        supported: false, 
        error: 'getUserMedia APIがサポートされていません。ブラウザを最新バージョンに更新してください。' 
      };
    }

    // セキュアコンテキストまたは開発LANを許可
    if (!isSecureContextOrDevLAN()) {
      return { 
        supported: false, 
        error: 'カメラ機能はHTTPS接続が必要です。セキュアな接続でアクセスしてください。' 
      };
    }

    // カメラデバイスの検出
    const { hasCamera, devices } = await checkCameraDevices();
    
    if (!hasCamera) {
      const isDesktop = !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isDesktop) {
        return {
          supported: false,
          error: 'カメラデバイスが見つかりません。\n\n' +
                '【PCでの確認事項】\n' +
                '• ウェブカメラが正しく接続されているか\n' +
                '• 他のアプリケーション（Zoom、Teams等）でカメラを使用していないか\n' +
                '• デバイスマネージャーでカメラが認識されているか\n' +
                '• ブラウザでカメラへのアクセスが許可されているか'
        };
      } else {
        return {
          supported: false,
          error: 'カメラが見つかりません。\n\n' +
                '【モバイルでの確認事項】\n' +
                '• カメラアプリが正常に動作するか\n' +
                '• ブラウザでカメラへのアクセスが許可されているか\n' +
                '• プライベートモードを無効にしてください'
        };
      }
    }

    // モバイルブラウザの特殊チェック
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isIOS) {
      // iOS Safari特有の制限チェック
      const safariMatch = navigator.userAgent.match(/Version\/([\d.]+).*Safari/);
      if (safariMatch && parseFloat(safariMatch[1]) < 11) {
        return { 
          supported: false, 
          error: 'iOSのSafariを最新バージョンに更新してください。カメラ機能にはSafari 11以降が必要です。' 
        };
      }
    }

    if (isAndroid) {
      // Android Chromeの古いバージョンチェック
      const chromeMatch = navigator.userAgent.match(/Chrome\/(\d+)/);
      if (chromeMatch && parseInt(chromeMatch[1]) < 70) {
        return { 
          supported: false, 
          error: 'Android Chromeを最新バージョンに更新してください。カメラ機能にはChrome 70以降が必要です。' 
        };
      }
    }

    const deviceInfo = devices.length > 0 
      ? `検出されたカメラ: ${devices.length}台` 
      : '';

    return { supported: true, deviceInfo };
  }, [checkCameraDevices]);

  /**
   * カメラストリームを開始（最小構成）
   */
  const startCamera = useCallback(async () => {
    setIsCameraLoading(true);
    setError('');

    try {
      // セキュアコンテキストまたは開発LANを許可
      if (!isSecureContextOrDevLAN()) {
        setError('カメラ機能はHTTPS接続が必要です。セキュアな接続でアクセスしてください。');
        return;
      }

      // 単純なconstraints（背面優先）
      const constraints: MediaStreamConstraints = {
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints).catch((e) => {
        console.error('getUserMedia error:', e?.name || e, e);
        throw e;
      });

      setStream(mediaStream);
      setMode('camera');

      if (videoRef.current) {
        const video = videoRef.current;
        // 属性とsrcObjectを設定
        video.srcObject = mediaStream;
        video.muted = true;
        video.autoplay = true;
        video.playsInline = true;
        try {
          (video as any).webkitPlaysInline = true;
          video.setAttribute('playsinline', '');
          video.setAttribute('webkit-playsinline', '');
          video.setAttribute('muted', '');
          video.setAttribute('autoplay', '');
        } catch {}

        // メタデータ読み込み後に再生
        await new Promise<void>((resolve) => {
          const onLoaded = async () => {
            try { await video.play(); } catch {}
            resolve();
          };
          if (video.readyState >= 1) {
            onLoaded();
          } else {
            video.addEventListener('loadedmetadata', onLoaded, { once: true });
            setTimeout(onLoaded, 1500);
          }
        });
      }

    } catch (error) {
      console.error('カメラ起動エラー:', error);
      setError('カメラにアクセスできません。ブラウザの権限とHTTPS接続を確認してください。');
    } finally {
      setIsCameraLoading(false);
    }
  }, []);
  
  /**
   * カメラストリームを停止
   */
  const stopCamera = useCallback(() => {
    console.log('カメラストリーム停止開始');
    
    if (stream) {
      stream.getTracks().forEach(track => {
        console.log('トラック停止:', track.kind, track.label);
        track.stop();
      });
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.pause();
    }
    
    setCapturedImage('');
    setMode('select');
    console.log('カメラストリーム停止完了');
  }, [stream]);
  
  /**
   * 写真を撮影
   */
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) {
      setError('カメラが準備できていません。しばらくお待ちください。');
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setError('Canvasの初期化に失敗しました');
        return;
      }

      // 準備確認
      if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
        setError('カメラの初期化中です。もう少しお待ちください。');
        return;
      }

      // Canvasを実寸に
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = canvas.toDataURL('image/jpeg', 0.85);
      if (!imageData) {
        setError('撮影に失敗しました。もう一度お試しください。');
        return;
      }

      setCapturedImage(imageData);
      setMode('preview');

    } catch (error) {
      console.error('撮影エラー:', error);
      setError('撮影中にエラーが発生しました');
    }
  }, []);
  
  /**
   * 撮影をやり直す
   */
  const retakePhoto = useCallback(() => {
    setCapturedImage('');
    setError(''); // エラーをリセット
    startCamera();
  }, [startCamera]);
  
  /**
   * 撮影した写真を確定
   */
  const confirmPhoto = useCallback(async () => {
    if (!capturedImage || !canvasRef.current) return;
    
    try {
      setIsCameraLoading(true);
      
      // Canvas から画像を圧縮
      const compressionResult = await compressCanvasImage(
        canvasRef.current,
        'camera-capture',
        {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.8,
          outputFormat: 'jpeg',
          maxSizeInMB: maxSizeInMB,
        }
      );
      
      console.log('Image compression result:', compressionResult);
      
      // FileList を作成してコールバックを呼び出す
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(compressionResult.file);
      
      onImagesSelected(dataTransfer.files);
      
    } catch (error) {
      console.error('画像確定エラー:', error);
      setError('画像の処理中にエラーが発生しました');
    } finally {
      setIsCameraLoading(false);
    }
  }, [capturedImage, maxSizeInMB, onImagesSelected]);
  
  // ===================================================================
  // イベントハンドラー
  // ===================================================================
  
  /**
   * ギャラリー選択ボタンクリック処理
   */
  const handleGalleryClick = useCallback(() => {
    setError('');
    fileInputRef.current?.click();
  }, []);
  
  /**
   * ファイル選択処理
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    try {
      // ファイル数チェック
      if (files.length > maxFiles) {
        setError(`選択できる画像は最大${maxFiles}枚です`);
        return;
      }
      
      // ファイルサイズチェック
      const oversizedFiles: string[] = [];
      const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
      
      Array.from(files).forEach(file => {
        if (file.size > maxSizeInBytes) {
          oversizedFiles.push(file.name);
        }
      });
      
      if (oversizedFiles.length > 0) {
        setError(`以下のファイルがサイズ制限（${maxSizeInMB}MB）を超えています：${oversizedFiles.join(', ')}`);
        return;
      }
      
      // ファイル形式チェック
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const invalidFiles: string[] = [];
      
      Array.from(files).forEach(file => {
        if (!allowedTypes.includes(file.type)) {
          invalidFiles.push(file.name);
        }
      });
      
      if (invalidFiles.length > 0) {
        setError(`以下のファイルは対応していない形式です：${invalidFiles.join(', ')}`);
        return;
      }
      
      // 画像選択完了
      onImagesSelected(files);
      
    } catch (error) {
      console.error('ファイル選択エラー:', error);
      setError('ファイルの処理中にエラーが発生しました');
    }
    
    // ファイル入力をリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  /**
   * モーダルクローズ時の処理
   */
  const handleClose = useCallback(() => {
    if (!isUploading && !isCameraLoading) {
      stopCamera(); // カメラストリームを停止
      setError('');
      setMode('select');
      setCapturedImage('');
      onClose();
    }
  }, [isUploading, isCameraLoading, stopCamera, onClose]);
  
  // ===================================================================
  // エフェクト
  // ===================================================================
  
  /**
   * モードとストリームが揃ったら video 要素へ確実にストリームを接続
   * レンダリング順序による参照未設定を回避
   */
  useEffect(() => {
    if (mode !== 'camera') return;
    const video = videoRef.current;
    if (!video || !stream) return;

    // 属性と srcObject を設定
    video.srcObject = stream;
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
    try {
      (video as any).webkitPlaysInline = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.setAttribute('muted', '');
      video.setAttribute('autoplay', '');
    } catch {}

    const play = async () => {
      try { await video.play(); } catch {}
    };

    if (video.readyState >= 1) {
      play();
    } else {
      video.addEventListener('loadedmetadata', play, { once: true });
    }

    return () => {
      try {
        video.pause();
        // 接続解除（停止は stopCamera 側で実施）
        (video as HTMLVideoElement).srcObject = null;
      } catch {}
    };
  }, [mode, stream]);
  
  /**
   * コンポーネントのクリーンアップ
   */
  useEffect(() => {
    const currentTimer = videoMonitorRef.current;
    const currentStream = stream;
    
    return () => {
      // 監視タイマーをクリア
      if (currentTimer) {
        clearTimeout(currentTimer);
      }
      
      // コンポーネントがアンマウントされる際にカメラストリームを停止
      if (currentStream) {
        console.log('コンポーネントアンマウント時のストリーム停止');
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);
  
  /**
   * モーダルが閉じられた時のクリーンアップ
   */
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setMode('select');
      setCapturedImage('');
      setError('');
    }
  }, [isOpen, stopCamera]);

  /**
   * モーダルが開いた時の初期化
   */
  useEffect(() => {
    if (!isOpen) return;
    if (initialMode === 'camera') {
      setMode('select');
      setTimeout(() => {
        startCamera();
      }, 0);
    } else if (initialMode === 'gallery') {
      setMode('select');
      setTimeout(() => {
        handleGalleryClick();
      }, 0);
    }
  }, [isOpen, initialMode, startCamera, handleGalleryClick]);
  
  // ===================================================================
  // レンダリング
  // ===================================================================
  
  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={
          mode === 'camera' ? 'カメラで撮影' :
          mode === 'preview' ? '撮影確認' :
          '写真を選択'
        }
        size={mode === 'camera' || mode === 'preview' ? 'lg' : 'sm'}
        closeOnOverlayClick={!isUploading && !isCameraLoading && mode === 'select'}
        closeOnEsc={!isUploading && !isCameraLoading && mode === 'select'}
        showCloseButton={!isUploading && !isCameraLoading && mode === 'select'}
      >
        <div className="space-y-6">
          
          {/* ローディング表示 */}
          {(isUploading || isCameraLoading) ? (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                {isUploading ? '画像を解析中...' : 'カメラを起動中...'}
              </p>
              <p className="text-sm text-gray-600">
                {isUploading 
                  ? 'AIが食材を認識しています。しばらくお待ちください。'
                  : 'カメラの準備をしています。しばらくお待ちください。'
                }
              </p>
            </div>
          ) : mode === 'select' ? (
            /* 選択画面 */
            <>
              {/* ギャラリー選択ボタン */}
              <Button
                onClick={handleGalleryClick}
                variant="secondary"
                fullWidth
                leftIcon={<Upload className="w-6 h-6" />}
                className="h-16 border-2 border-dashed border-blue-300 hover:border-blue-400 hover:bg-blue-50"
              >
                <div className="text-center">
                  <p className="font-medium text-blue-700">ギャラリーから選択</p>
                  <p className="text-xs text-blue-600">
                    最大{maxFiles}枚、{maxSizeInMB}MBまで
                  </p>
                </div>
              </Button>
              
              <div className="flex items-center">
                <div className="flex-1 border-t border-gray-300"></div>
                <div className="px-3 text-sm text-gray-500">または</div>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>
              
              {/* カメラ撮影ボタン */}
              <Button
                onClick={async () => {
                  setError('');
                  try {
                    const supportCheck = await checkCameraSupport();
                    if (!supportCheck.supported) {
                      setError(supportCheck.error || 'カメラ機能がサポートされていません。');
                      return;
                    }
                    await startCamera();
                  } catch (error) {
                    console.error('カメラ起動エラー:', error);
                    setError('カメラの起動中にエラーが発生しました。');
                  }
                }}
                variant="primary"
                fullWidth
                leftIcon={<Camera className="w-6 h-6" />}
                className="h-16 border-2 border-dashed border-orange-300 hover:border-orange-400 hover:bg-orange-50"
              >
                <div className="text-center">
                  <p className="font-medium">カメラで撮影</p>
                  <p className="text-xs opacity-75">
                    その場で撮影・圧縮処理
                  </p>
                </div>
              </Button>
              
              {/* エラーメッセージ */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-red-800 mb-1">カメラエラー</h4>
                      <div className="text-sm text-red-600 whitespace-pre-line">
                        {error}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 注意事項とヒント */}
              <div className="space-y-3">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    🔒 セキュリティ要件
                  </h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• HTTPS接続が必要です（安全な通信のため）</li>
                    <li>• カメラアクセスの許可が必要です</li>
                    <li>• Chrome、Safari、Firefoxの最新版を推奨</li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    📸 撮影のコツ
                  </h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• 食材がはっきりと見えるように撮影してください</li>
                    <li>• 明るい場所で撮影すると認識精度が上がります</li>
                    <li>• 複数の食材を一度に撮影できます</li>
                    <li>• スマホは横向きよりも縦向きがおすすめ</li>
                  </ul>
                </div>
              </div>
              
              {/* キャンセルボタン */}
              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleClose}
                  variant="minimal"
                >
                  キャンセル
                </Button>
              </div>
            </>
          ) : mode === 'camera' ? (
            /* カメラ撮影画面 */
            <>
              <div className="relative bg-black rounded-xl overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  controls={false}
                  className="w-full h-72 sm:h-96 bg-gray-900"
                  style={{
                    objectFit: 'cover',
                    objectPosition: 'center'
                  }}
                  onLoadedData={() => {
                    console.log('ビデオデータ読み込み完了');
                    if (videoRef.current) {
                      const video = videoRef.current;
                      console.log('ビデオ情報:', {
                        videoWidth: video.videoWidth,
                        videoHeight: video.videoHeight,
                        readyState: video.readyState,
                        paused: video.paused
                      });
                    }
                  }}
                  onCanPlay={() => {
                    console.log('ビデオ再生準備完了');
                  }}
                  onPlaying={() => {
                    console.log('ビデオ再生中');
                  }}
                  onError={(e) => {
                    console.error('ビデオエラー:', e);
                  }}
                />
                
                {/* 撮影ボタン */}
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                  <button
                    onClick={capturePhoto}
                    disabled={isCameraLoading}
                    className="w-20 h-20 bg-white rounded-full shadow-2xl border-4 border-white hover:border-orange-400 transition-all duration-300 flex items-center justify-center active:scale-95 group disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="写真を撮影する"
                  >
                    <div className="w-14 h-14 bg-orange-500 rounded-full group-hover:bg-orange-600 group-disabled:bg-gray-400 transition-colors duration-200 flex items-center justify-center text-white text-xs font-bold">
                      {isCameraLoading ? '...' : '●'}
                    </div>
                  </button>
                </div>
                
                {/* カメラフレーム */}
                <div className="absolute inset-4 border-2 border-white/20 rounded-xl pointer-events-none"></div>
                
                {/* キャンセルボタン */}
                <button
                  onClick={stopCamera}
                  className="absolute top-4 right-4 w-12 h-12 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-105"
                  aria-label="カメラを閉じる"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* 状態表示とガイド */}
              <div className="text-center text-sm text-gray-600 space-y-2">
                {error ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-red-600 text-xs font-medium">{error}</p>
                  </div>
                ) : (
                  <>
                    <p className="font-medium text-green-700">✓ カメラ接続中</p>
                    <p className="font-medium">📸 シャッターボタンで撮影</p>
                    <p className="text-xs">フレーム内に食材を配置してください</p>
                    {videoRef.current && (
                      <div className="bg-blue-50 p-2 rounded-lg mt-2">
                        <p className="text-xs font-mono text-blue-700">
                          カメラ情報: {videoRef.current.videoWidth || 0} × {videoRef.current.videoHeight || 0}
                        </p>
                        <p className="text-xs font-mono text-blue-600">
                          状態: {videoRef.current.readyState}/4 | 再生: {videoRef.current.paused ? '一時停止' : '中'}
                        </p>
                        {(videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) && (
                          <p className="text-xs text-orange-600 mt-1">
                            ⚠️ カメラ初期化中...
                          </p>
                        )}
                        {stream && (
                          <p className="text-xs font-mono text-green-600">
                            ストリーム: {stream.getTracks().length}本 | アクティブ: {stream.active ? 'Yes' : 'No'}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          ) : mode === 'preview' && capturedImage ? (
            /* 撮影プレビュー画面 */
            <>
              <div className="relative bg-gray-100 rounded-xl overflow-hidden shadow-lg">
                <img
                  src={capturedImage}
                  alt="撮影した写真"
                  className="w-full h-72 sm:h-96 object-cover"
                />
                {/* 撮影完了アイコン */}
                <div className="absolute top-4 left-4 bg-green-500 text-white rounded-full p-2 shadow-lg">
                  <Camera className="w-5 h-5" />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={retakePhoto}
                  variant="secondary"
                  fullWidth
                  leftIcon={<RotateCcw className="w-5 h-5" />}
                  className="border-2 hover:border-orange-300"
                >
                  撮り直し
                </Button>
                
                <Button
                  onClick={confirmPhoto}
                  variant="primary"
                  fullWidth
                  disabled={isCameraLoading}
                  loading={isCameraLoading}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                >
                  {isCameraLoading ? '処理中...' : 'この写真を使用'}
                </Button>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500 text-white rounded-full p-1.5 flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold">AI</span>
                  </div>
                  <div>
                    <p className="text-sm text-blue-800 font-medium mb-1">
                      画像処理について
                    </p>
                    <p className="text-xs text-blue-700">
                      撮影した画像は自動で圧縮・最適化され、AIが食材を認識します
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : null}
          
        </div>
      </Modal>
      
      {/* 隠しファイル入力 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />
      
      {/* 隠しCanvas要素（撮影用） */}
      <canvas
        ref={canvasRef}
        className="hidden"
        aria-hidden="true"
      />
    </>
  );
}