<?php

namespace App\Http\Controllers\Api\V1\Settings;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentMethodController extends Controller
{
    /**
     * List all payment methods.
     */
    public function index(Request $request): JsonResponse
    {
        $query = PaymentMethod::orderBy('name');

        // Filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $paymentMethods = $query->get();

        return response()->json([
            'payment_methods' => $paymentMethods,
        ]);
    }

    /**
     * Create a new payment method.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'is_active' => 'boolean',
            'settings' => 'nullable|array',
        ]);

        $paymentMethod = PaymentMethod::create([
            'name' => $request->name,
            'is_active' => $request->is_active ?? true,
            'settings' => $request->settings,
        ]);

        return response()->json([
            'message' => 'Payment method created successfully',
            'payment_method' => $paymentMethod,
        ], 201);
    }

    /**
     * Get a specific payment method.
     */
    public function show(string $id): JsonResponse
    {
        $paymentMethod = PaymentMethod::findOrFail($id);

        return response()->json([
            'payment_method' => $paymentMethod,
        ]);
    }

    /**
     * Update a payment method.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $paymentMethod = PaymentMethod::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'is_active' => 'boolean',
            'settings' => 'nullable|array',
        ]);

        $paymentMethod->update([
            'name' => $request->name,
            'is_active' => $request->is_active ?? $paymentMethod->is_active,
            'settings' => $request->settings,
        ]);

        return response()->json([
            'message' => 'Payment method updated successfully',
            'payment_method' => $paymentMethod->fresh(),
        ]);
    }

    /**
     * Delete a payment method.
     */
    public function destroy(string $id): JsonResponse
    {
        $paymentMethod = PaymentMethod::findOrFail($id);

        // Check if can be deleted
        $canDelete = $paymentMethod->canDelete();
        if (!$canDelete['can_delete']) {
            return response()->json([
                'message' => $canDelete['reason'],
            ], 422);
        }

        $paymentMethod->delete();

        return response()->json([
            'message' => 'Payment method deleted successfully',
        ]);
    }

    /**
     * Toggle payment method active status.
     */
    public function toggleActive(string $id): JsonResponse
    {
        $paymentMethod = PaymentMethod::findOrFail($id);
        $paymentMethod->update(['is_active' => !$paymentMethod->is_active]);

        return response()->json([
            'message' => 'Payment method status updated successfully',
            'payment_method' => $paymentMethod->fresh(),
        ]);
    }
}
