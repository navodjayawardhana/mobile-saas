<?php

namespace App\Http\Controllers\Api\V1\Settings;

use App\Http\Controllers\Controller;
use App\Services\TimezoneDetector;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ShopSettingsController extends Controller
{
    /**
     * Get shop settings.
     */
    public function show(Request $request): JsonResponse
    {
        $shop = $request->user()->shop;

        return response()->json([
            'shop' => [
                'id' => $shop->id,
                'name' => $shop->name,
                'slug' => $shop->slug,
                'email' => $shop->email,
                'phone' => $shop->phone,
                'address' => $shop->address,
                'logo' => $shop->logo,
                'timezone' => $shop->timezone,
                'default_currency_id' => $shop->default_currency_id,
                'subscription_plan' => $shop->subscription_plan,
                'settings' => $shop->settings,
            ],
        ]);
    }

    /**
     * Update shop settings.
     */
    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'timezone' => 'nullable|string|max:50',
            'default_currency_id' => 'nullable|uuid|exists:currencies,id',
            'settings' => 'nullable|array',
        ]);

        $shop = $request->user()->shop;

        $shop->update([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'address' => $request->address,
            'timezone' => $request->timezone ?? $shop->timezone,
            'default_currency_id' => $request->default_currency_id,
            'settings' => $request->settings,
        ]);

        return response()->json([
            'message' => 'Shop settings updated successfully',
            'shop' => $shop->fresh(),
        ]);
    }

    /**
     * Upload shop logo.
     */
    public function uploadLogo(Request $request): JsonResponse
    {
        $request->validate([
            'logo' => 'required|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        $shop = $request->user()->shop;

        // Delete old logo
        if ($shop->logo) {
            Storage::disk('public')->delete($shop->logo);
        }

        // Store new logo
        $path = $request->file('logo')->store('shops/logos', 'public');

        $shop->update(['logo' => $path]);

        return response()->json([
            'message' => 'Logo uploaded successfully',
            'logo' => $path,
        ]);
    }

    /**
     * Delete shop logo.
     */
    public function deleteLogo(Request $request): JsonResponse
    {
        $shop = $request->user()->shop;

        if ($shop->logo) {
            Storage::disk('public')->delete($shop->logo);
            $shop->update(['logo' => null]);
        }

        return response()->json([
            'message' => 'Logo deleted successfully',
        ]);
    }

    /**
     * Detect timezone from user's IP address.
     */
    public function detectTimezone(Request $request): JsonResponse
    {
        $locationData = TimezoneDetector::fromIp($request->ip());

        return response()->json([
            'timezone' => $locationData['timezone'],
            'country' => $locationData['country'],
            'country_code' => $locationData['country_code'],
            'city' => $locationData['city'],
            'currency' => $locationData['currency'],
        ]);
    }

    /**
     * Auto-update shop timezone based on IP.
     */
    public function autoUpdateTimezone(Request $request): JsonResponse
    {
        $shop = $request->user()->shop;
        $locationData = TimezoneDetector::fromIp($request->ip());

        $shop->update([
            'timezone' => $locationData['timezone'],
        ]);

        return response()->json([
            'message' => 'Timezone updated successfully',
            'timezone' => $locationData['timezone'],
            'country' => $locationData['country'],
        ]);
    }
}
