# FEEMAAS Workspace Engine Test

Version:
V1.1

---

## 1. Project Loading

Action:
Open workspace.

Expected:

- Project title is visible.
- Project description is visible.
- Active zone information is visible.

---

## 2. Visual Rendering

Action:
Load project with existing visual object.

Expected:

- Triangle is visible.
- Shape type is displayed as triangle.
- Material information is displayed.

---

## 3. Visual Selection

Action:
Click triangle.

Expected:

- Triangle receives blue selection border.
- Previous selection is removed.

---

## 4. Drag Test

Action:
Drag triangle to another position.

Expected:

- Triangle follows mouse correctly.
- No coordinate offset happens.
- Shape remains visible.

---

## 5. Persistence Test

Action:

1. Move triangle.
2. Release mouse.
3. Refresh page.

Expected:

- Triangle stays in new position.
- Database contains updated coordinates.

---

## 6. API Test

Endpoint:

GET /api/projects/

Expected:

- Project JSON returned.
- Zones returned.
- Visual objects returned.

---

## Current Stable Features

- SVG Rendering
- Polygon Visual Engine
- Triangle Object
- Drag System
- Position Persistence
- Django API Connection