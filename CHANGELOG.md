# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
- _Add new entries here for each `feat:` PR._

### Added
- Sessions list displays most recent chats first with last interaction date.
- CI-generated Mermaid component map for React hierarchy.

### Fixed
- Resolve Netlify 404 when navigating directly to `/login`.

## [1.4.0] - 2025-05-26
### Added
- Persist generated images to Supabase Storage [#128].

### Fixed
- Error handling for hide/delete session functions [#112].

## [1.3.0] - 2025-05-20
### Added
- Optimistic hide and delete actions for chat sessions [#115].
- Real-time session sync after hide/delete [#114].
- Settings panel opens via mobile edge swipe [#116].

### Fixed
- Resolved 500 errors in hideSession and deleteSession functions [#112].
- Stable SSE streaming from OpenAI chat completions [#95].

## [1.2.0] - 2025-05-19
### Added
- Reliable streaming chat via Server-Sent Events [#81].
- Basic image generation support using DALL·E [#102].

