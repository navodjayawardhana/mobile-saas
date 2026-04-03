<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Model;

trait PreventDeleteIfUsed
{
    /**
     * Boot the trait.
     */
    protected static function bootPreventDeleteIfUsed(): void
    {
        static::deleting(function (Model $model) {
            $relations = $model->getPreventDeleteRelations();

            foreach ($relations as $relation => $message) {
                if ($model->$relation()->exists()) {
                    throw new \Exception($message ?? "Cannot delete this record because it has related {$relation}.");
                }
            }
        });
    }

    /**
     * Get the relations to check before deleting.
     * Override this method in your model to specify relations.
     *
     * @return array<string, string> Array of relation name => error message
     */
    public function getPreventDeleteRelations(): array
    {
        return [];
    }

    /**
     * Check if the model can be safely deleted.
     *
     * @return array{can_delete: bool, reason: string|null}
     */
    public function canDelete(): array
    {
        $relations = $this->getPreventDeleteRelations();

        foreach ($relations as $relation => $message) {
            if ($this->$relation()->exists()) {
                return [
                    'can_delete' => false,
                    'reason' => $message ?? "Cannot delete because it has related {$relation}."
                ];
            }
        }

        return [
            'can_delete' => true,
            'reason' => null
        ];
    }
}
