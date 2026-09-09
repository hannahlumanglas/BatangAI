<?php

// Backward-compatible endpoint. Device creation is implemented in the shared
// devices endpoint so reading and writing always use the same data contract.
require __DIR__ . '/devices.php';
