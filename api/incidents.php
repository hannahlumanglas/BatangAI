<?php

// Keep the legacy endpoint available, but route it through the same
// role-scoped query used by every incident list.
require __DIR__ . '/get_incidents.php';
