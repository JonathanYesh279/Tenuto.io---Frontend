# Requirements: Tenuto.io v5.0

**Defined:** 2026-02-22
**Core Value:** Administrators can efficiently manage their conservatory's teachers, students, orchestras, and scheduling — with accurate hours tracking for ministry reporting.

## v5.0 Requirements

Requirements for Ministry Import Overhaul. All map to Phase 24.

### Import Backend

- [ ] **IMP-B01**: System auto-detects header row in Ministry Excel files by scanning rows 0-10 for column name matches
- [ ] **IMP-B02**: System recognizes Ministry column name variants (שם ומשפחה, שעה נוספת ל.., המורה, זמן שעור, שלב)
- [ ] **IMP-B03**: System detects instruments from Ministry department columns (כלי קשת, כלי נשיפה, כלי פריטה, etc.)
- [ ] **IMP-B04**: Unmatched import rows create new student records with minimal required fields
- [ ] **IMP-B05**: System validates Ministry-specific fields (stage א/ב/ג, age 3-99, numeric extraHour)
- [ ] **IMP-B06**: System converts weekly lesson hours (0.75) to duration minutes (45)

### Import Frontend

- [ ] **IMP-F01**: User sees file structure guide with required/optional/auto-detected column badges before upload
- [ ] **IMP-F02**: User sees Ministry file compatibility banner (תומך בקבצי מימשק)
- [ ] **IMP-F03**: Upload zone styled with v4.0 design language (rounded-3xl, dashed border, FileXls icon)
- [ ] **IMP-F04**: Preview shows create vs update vs error rows with color-coded badges
- [ ] **IMP-F05**: Summary stat cards show total/update/create/error counts in v4.0 gradient style
- [ ] **IMP-F06**: Preview table displays detected instrument column with v4.0 header styling
- [ ] **IMP-F07**: Results display shows separate create/update counts with toast notification
- [ ] **IMP-F08**: Ministry file detection banner shows detected header row number in preview state

## Future Requirements

### Import Enhancements

- **IMP-F10**: Teacher import file structure guide and preview redesign (same patterns as student)
- **IMP-F11**: Import history / audit log showing past imports with results
- **IMP-F12**: Undo import — rollback created/updated records from a specific import

## Out of Scope

| Feature | Reason |
|---------|--------|
| Orchestra import | No Ministry format for orchestras |
| CSV import | Ministry uses .xlsx exclusively |
| Drag-and-drop column mapping | Auto-detection handles Ministry format; manual mapping adds complexity |
| Bulk delete from import | Destructive action, out of scope for import flow |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| IMP-B01 | Phase 24 | Pending |
| IMP-B02 | Phase 24 | Pending |
| IMP-B03 | Phase 24 | Pending |
| IMP-B04 | Phase 24 | Pending |
| IMP-B05 | Phase 24 | Pending |
| IMP-B06 | Phase 24 | Pending |
| IMP-F01 | Phase 24 | Pending |
| IMP-F02 | Phase 24 | Pending |
| IMP-F03 | Phase 24 | Pending |
| IMP-F04 | Phase 24 | Pending |
| IMP-F05 | Phase 24 | Pending |
| IMP-F06 | Phase 24 | Pending |
| IMP-F07 | Phase 24 | Pending |
| IMP-F08 | Phase 24 | Pending |

**Coverage:**
- v5.0 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-22*
*Last updated: 2026-02-22 after initial definition*
