<?php

namespace App\Service;

class CloudinaryService
{
    public function __construct(
        private readonly string $cloudName,
        private readonly string $apiKey,
        private readonly string $apiSecret,
    ) {}

    public function upload(string $filePath, string $folder = 'sailingloc'): array
    {
        $timestamp = time();
        $params = [
            'folder'    => $folder,
            'timestamp' => $timestamp,
        ];
        ksort($params);
        $paramStr = implode('&', array_map(fn($k, $v) => "{$k}={$v}", array_keys($params), $params));
        $signature = sha1($paramStr . $this->apiSecret);

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL            => "https://api.cloudinary.com/v1_1/{$this->cloudName}/image/upload",
            CURLOPT_POST           => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POSTFIELDS     => [
                'file'       => new \CURLFile($filePath),
                'folder'     => $folder,
                'timestamp'  => $timestamp,
                'api_key'    => $this->apiKey,
                'signature'  => $signature,
            ],
        ]);
        $response = curl_exec($ch);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new \RuntimeException('Cloudinary upload failed: ' . $error);
        }

        $data = json_decode($response, true);
        if (isset($data['error'])) {
            throw new \RuntimeException('Cloudinary error: ' . $data['error']['message']);
        }

        return ['url' => $data['secure_url'], 'publicId' => $data['public_id']];
    }

    public function delete(string $publicId): void
    {
        $timestamp = time();
        $signature = sha1("public_id={$publicId}&timestamp={$timestamp}" . $this->apiSecret);

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL            => "https://api.cloudinary.com/v1_1/{$this->cloudName}/image/destroy",
            CURLOPT_POST           => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POSTFIELDS     => [
                'public_id' => $publicId,
                'timestamp' => $timestamp,
                'api_key'   => $this->apiKey,
                'signature' => $signature,
            ],
        ]);
        curl_exec($ch);
        curl_close($ch);
    }
}
