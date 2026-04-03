<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetShopContext
{
    /**
     * Handle an incoming request.
     * Sets the current shop context from the authenticated user.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && $request->user()->shop_id) {
            // Store shop_id in a way that's accessible throughout the request
            app()->instance('current_shop_id', $request->user()->shop_id);
        }

        return $next($request);
    }
}
