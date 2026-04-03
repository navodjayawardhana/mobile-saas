<?php

namespace App\Http\Controllers\Api\V1\Settings;

use App\Http\Controllers\Controller;
use App\Models\Currency;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CurrencyController extends Controller
{
    /**
     * List all currencies.
     */
    public function index(Request $request): JsonResponse
    {
        $currencies = Currency::orderBy('is_default', 'desc')
            ->orderBy('name')
            ->get();

        return response()->json([
            'currencies' => $currencies,
        ]);
    }

    /**
     * Create a new currency.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string|max:10',
            'name' => 'required|string|max:255',
            'symbol' => 'required|string|max:10',
            'exchange_rate' => 'required|numeric|min:0',
            'is_default' => 'boolean',
        ]);

        // Check for duplicate code
        $exists = Currency::where('code', $request->code)->exists();
        if ($exists) {
            return response()->json([
                'message' => 'Currency with this code already exists',
            ], 422);
        }

        $currency = Currency::create([
            'code' => strtoupper($request->code),
            'name' => $request->name,
            'symbol' => $request->symbol,
            'exchange_rate' => $request->exchange_rate,
            'is_default' => $request->is_default ?? false,
        ]);

        // If this is set as default, update others
        if ($currency->is_default) {
            $currency->setAsDefault();
        }

        return response()->json([
            'message' => 'Currency created successfully',
            'currency' => $currency,
        ], 201);
    }

    /**
     * Get a specific currency.
     */
    public function show(string $id): JsonResponse
    {
        $currency = Currency::findOrFail($id);

        return response()->json([
            'currency' => $currency,
        ]);
    }

    /**
     * Update a currency.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $currency = Currency::findOrFail($id);

        $request->validate([
            'code' => 'required|string|max:10',
            'name' => 'required|string|max:255',
            'symbol' => 'required|string|max:10',
            'exchange_rate' => 'required|numeric|min:0',
            'is_default' => 'boolean',
        ]);

        // Check for duplicate code (excluding current)
        $exists = Currency::where('code', $request->code)
            ->where('id', '!=', $id)
            ->exists();
        if ($exists) {
            return response()->json([
                'message' => 'Currency with this code already exists',
            ], 422);
        }

        $currency->update([
            'code' => strtoupper($request->code),
            'name' => $request->name,
            'symbol' => $request->symbol,
            'exchange_rate' => $request->exchange_rate,
        ]);

        // If this is set as default, update others
        if ($request->is_default && !$currency->is_default) {
            $currency->setAsDefault();
        }

        return response()->json([
            'message' => 'Currency updated successfully',
            'currency' => $currency->fresh(),
        ]);
    }

    /**
     * Delete a currency.
     */
    public function destroy(string $id): JsonResponse
    {
        $currency = Currency::findOrFail($id);

        // Cannot delete default currency
        if ($currency->is_default) {
            return response()->json([
                'message' => 'Cannot delete the default currency',
            ], 422);
        }

        // Check if can be deleted
        $canDelete = $currency->canDelete();
        if (!$canDelete['can_delete']) {
            return response()->json([
                'message' => $canDelete['reason'],
            ], 422);
        }

        $currency->delete();

        return response()->json([
            'message' => 'Currency deleted successfully',
        ]);
    }

    /**
     * Set currency as default.
     */
    public function setDefault(string $id): JsonResponse
    {
        $currency = Currency::findOrFail($id);
        $currency->setAsDefault();

        return response()->json([
            'message' => 'Default currency updated successfully',
            'currency' => $currency->fresh(),
        ]);
    }
}
