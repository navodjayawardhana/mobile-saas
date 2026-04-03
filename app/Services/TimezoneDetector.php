<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class TimezoneDetector
{
    /**
     * Detect timezone from IP address using ip-api.com (free, no API key needed)
     */
    public static function fromIp(?string $ip = null): array
    {
        // Get IP if not provided
        $ip = $ip ?? request()->ip();

        // Skip for localhost/private IPs
        if (self::isPrivateIp($ip)) {
            return [
                'timezone' => 'UTC',
                'country' => null,
                'country_code' => null,
                'city' => null,
                'currency' => 'USD',
            ];
        }

        // Cache the result for 24 hours to avoid hitting API limits
        $cacheKey = 'timezone_' . md5($ip);

        return Cache::remember($cacheKey, 86400, function () use ($ip) {
            try {
                $response = Http::timeout(5)->get("http://ip-api.com/json/{$ip}", [
                    'fields' => 'status,country,countryCode,city,timezone,currency'
                ]);

                if ($response->successful()) {
                    $data = $response->json();

                    if ($data['status'] === 'success') {
                        return [
                            'timezone' => $data['timezone'] ?? 'UTC',
                            'country' => $data['country'] ?? null,
                            'country_code' => $data['countryCode'] ?? null,
                            'city' => $data['city'] ?? null,
                            'currency' => self::getCurrencyFromCountry($data['countryCode'] ?? null),
                        ];
                    }
                }
            } catch (\Exception $e) {
                Log::warning('Timezone detection failed: ' . $e->getMessage());
            }

            return [
                'timezone' => 'UTC',
                'country' => null,
                'country_code' => null,
                'city' => null,
                'currency' => 'USD',
            ];
        });
    }

    /**
     * Check if IP is private/localhost
     */
    private static function isPrivateIp(string $ip): bool
    {
        if ($ip === '127.0.0.1' || $ip === '::1' || $ip === 'localhost') {
            return true;
        }

        return filter_var(
            $ip,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
        ) === false;
    }

    /**
     * Get currency code from country code
     */
    private static function getCurrencyFromCountry(?string $countryCode): string
    {
        $currencies = [
            'US' => 'USD',
            'GB' => 'GBP',
            'EU' => 'EUR',
            'DE' => 'EUR',
            'FR' => 'EUR',
            'IT' => 'EUR',
            'ES' => 'EUR',
            'NL' => 'EUR',
            'BE' => 'EUR',
            'AT' => 'EUR',
            'PT' => 'EUR',
            'IE' => 'EUR',
            'FI' => 'EUR',
            'GR' => 'EUR',
            'JP' => 'JPY',
            'CN' => 'CNY',
            'IN' => 'INR',
            'AU' => 'AUD',
            'CA' => 'CAD',
            'CH' => 'CHF',
            'SG' => 'SGD',
            'HK' => 'HKD',
            'NZ' => 'NZD',
            'SE' => 'SEK',
            'NO' => 'NOK',
            'DK' => 'DKK',
            'MX' => 'MXN',
            'BR' => 'BRL',
            'RU' => 'RUB',
            'ZA' => 'ZAR',
            'KR' => 'KRW',
            'TH' => 'THB',
            'MY' => 'MYR',
            'ID' => 'IDR',
            'PH' => 'PHP',
            'VN' => 'VND',
            'PK' => 'PKR',
            'BD' => 'BDT',
            'LK' => 'LKR',
            'AE' => 'AED',
            'SA' => 'SAR',
            'QA' => 'QAR',
            'KW' => 'KWD',
            'EG' => 'EGP',
            'NG' => 'NGN',
            'KE' => 'KES',
            'GH' => 'GHS',
            'TR' => 'TRY',
            'PL' => 'PLN',
            'CZ' => 'CZK',
            'HU' => 'HUF',
            'RO' => 'RON',
            'IL' => 'ILS',
            'CL' => 'CLP',
            'CO' => 'COP',
            'AR' => 'ARS',
            'PE' => 'PEN',
        ];

        return $currencies[$countryCode] ?? 'USD';
    }

    /**
     * Get currency details
     */
    public static function getCurrencyDetails(string $code): array
    {
        $currencies = [
            'USD' => ['name' => 'US Dollar', 'symbol' => '$'],
            'EUR' => ['name' => 'Euro', 'symbol' => '€'],
            'GBP' => ['name' => 'British Pound', 'symbol' => '£'],
            'JPY' => ['name' => 'Japanese Yen', 'symbol' => '¥'],
            'CNY' => ['name' => 'Chinese Yuan', 'symbol' => '¥'],
            'INR' => ['name' => 'Indian Rupee', 'symbol' => '₹'],
            'AUD' => ['name' => 'Australian Dollar', 'symbol' => 'A$'],
            'CAD' => ['name' => 'Canadian Dollar', 'symbol' => 'C$'],
            'CHF' => ['name' => 'Swiss Franc', 'symbol' => 'CHF'],
            'SGD' => ['name' => 'Singapore Dollar', 'symbol' => 'S$'],
            'HKD' => ['name' => 'Hong Kong Dollar', 'symbol' => 'HK$'],
            'NZD' => ['name' => 'New Zealand Dollar', 'symbol' => 'NZ$'],
            'SEK' => ['name' => 'Swedish Krona', 'symbol' => 'kr'],
            'NOK' => ['name' => 'Norwegian Krone', 'symbol' => 'kr'],
            'DKK' => ['name' => 'Danish Krone', 'symbol' => 'kr'],
            'MXN' => ['name' => 'Mexican Peso', 'symbol' => 'MX$'],
            'BRL' => ['name' => 'Brazilian Real', 'symbol' => 'R$'],
            'RUB' => ['name' => 'Russian Ruble', 'symbol' => '₽'],
            'ZAR' => ['name' => 'South African Rand', 'symbol' => 'R'],
            'KRW' => ['name' => 'South Korean Won', 'symbol' => '₩'],
            'THB' => ['name' => 'Thai Baht', 'symbol' => '฿'],
            'MYR' => ['name' => 'Malaysian Ringgit', 'symbol' => 'RM'],
            'IDR' => ['name' => 'Indonesian Rupiah', 'symbol' => 'Rp'],
            'PHP' => ['name' => 'Philippine Peso', 'symbol' => '₱'],
            'VND' => ['name' => 'Vietnamese Dong', 'symbol' => '₫'],
            'PKR' => ['name' => 'Pakistani Rupee', 'symbol' => '₨'],
            'BDT' => ['name' => 'Bangladeshi Taka', 'symbol' => '৳'],
            'LKR' => ['name' => 'Sri Lankan Rupee', 'symbol' => 'Rs'],
            'AED' => ['name' => 'UAE Dirham', 'symbol' => 'د.إ'],
            'SAR' => ['name' => 'Saudi Riyal', 'symbol' => '﷼'],
            'QAR' => ['name' => 'Qatari Riyal', 'symbol' => '﷼'],
            'KWD' => ['name' => 'Kuwaiti Dinar', 'symbol' => 'د.ك'],
            'EGP' => ['name' => 'Egyptian Pound', 'symbol' => 'E£'],
            'NGN' => ['name' => 'Nigerian Naira', 'symbol' => '₦'],
            'KES' => ['name' => 'Kenyan Shilling', 'symbol' => 'KSh'],
            'GHS' => ['name' => 'Ghanaian Cedi', 'symbol' => '₵'],
            'TRY' => ['name' => 'Turkish Lira', 'symbol' => '₺'],
            'PLN' => ['name' => 'Polish Zloty', 'symbol' => 'zł'],
            'CZK' => ['name' => 'Czech Koruna', 'symbol' => 'Kč'],
            'HUF' => ['name' => 'Hungarian Forint', 'symbol' => 'Ft'],
            'RON' => ['name' => 'Romanian Leu', 'symbol' => 'lei'],
            'ILS' => ['name' => 'Israeli Shekel', 'symbol' => '₪'],
            'CLP' => ['name' => 'Chilean Peso', 'symbol' => 'CLP$'],
            'COP' => ['name' => 'Colombian Peso', 'symbol' => 'COL$'],
            'ARS' => ['name' => 'Argentine Peso', 'symbol' => 'AR$'],
            'PEN' => ['name' => 'Peruvian Sol', 'symbol' => 'S/'],
        ];

        return $currencies[$code] ?? ['name' => 'US Dollar', 'symbol' => '$'];
    }
}
