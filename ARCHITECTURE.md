# Woodopia Architecture

## 1. Project Identity

Woodopia is the current product/brand name and deployment domain.

The underlying platform architecture is designed to support a future rebranding or domain change without requiring major changes to the core data model.

---

## 2. Core Principle

Users, organizations, roles, permissions, reputation, and project assignments are separate concepts.

A person is never replaced by an organization.

An organization remains stable even when its members or managers change.

---

## 3. User

User represents a real person with one account on the platform.

A User may:

- act as a normal customer
- own or join organizations
- work as a designer
- work for a workshop
- participate in projects
- participate in multiple organizations
- have different roles in different organizations
- have different roles in different projects

The User account remains the same throughout all activities.

---

## 4. Customer

A normal customer should not be forced to understand organizations, memberships, roles, or permissions.

A newly registered user can immediately use the platform as a customer.

Customer capabilities may include:

- creating projects
- purchasing products/services
- requesting consultant assistance
- participating in project communication
- viewing project progress

Additional capabilities are activated only when required.

---

## 5. Reputation and Level

Reputation and Level belong to the User.

They are NOT properties of:

- an organization
- a role
- a project
- a membership

Example:

Hossein may have:

Level: 7
Reputation: 1840

If Hossein joins a workshop, his personal reputation remains his own.

---

## 6. Organization

Organization represents a persistent business or professional entity.

Examples:

- Workshop
- Design Studio
- Company
- Customer Organization

An Organization must remain stable even if its members change.

Example:

Workshop A

Manager:
Ali

If Ali leaves and Hassan becomes manager:

Workshop A remains the same Organization.

Existing projects, history, reputation, records, and relationships remain attached to Workshop A.

---

## 7. Organization Application

Users may request creation/activation of an organization or professional panel.

Examples:

- Workshop panel
- Designer panel
- Professional organization

The application must be reviewed by an administrator.

Application states:

- Pending
- Edit Required
- Approved
- Rejected

Admin review must be auditable.

Each review should record:

- reviewer
- action
- comment
- timestamp

An Organization and its active panel are created/activated only after approval.

---

## 8. Organization Membership

A User becomes associated with an Organization through Membership.

A Membership contains:

- User
- Organization
- Organization Role
- status
- joined_at
- ended_at

Membership history must be preserved.

Users must not be deleted from historical relationships simply because they leave an organization.

---

## 9. Organization Roles

Organization roles describe a person's position within an organization.

Examples for workshops:

- Owner
- Manager
- Technical Manager
- Production Manager
- QC
- Designer
- Member

Roles must be separate from the User account.

Changing a manager means changing the Membership/Role assignment, not changing the Organization.

---

## 10. Permissions

Permissions determine what a User is allowed to do.

Permissions should be granted through roles rather than hard-coded directly into individual users whenever possible.

Examples:

- view_projects
- create_project
- manage_team
- manage_tenders
- view_bids
- manage_production
- manage_qc
- manage_organization

The permission system must remain extensible.

---

## 11. Organization Context

A User may belong to multiple organizations.

Example:

Hossein

Personal:
Independent Designer

Organization:
Ali Workshop

Project:
Project #105 Designer

The platform should allow the User to switch between contexts without creating multiple accounts.

The interface should remain simple for the User even though the underlying permission model is complex.

---

## 12. Project Participation

Project participation is different from Organization Membership.

A User may participate in a project without becoming a permanent member of an organization.

Example:

Hossein may be assigned as Designer to Project #105 for Ali's Workshop without becoming an employee/member of the workshop.

Project participation should therefore be modeled independently.

---

## 13. Project Roles

Project roles describe the person's responsibility within a specific project.

Examples:

- Customer
- Consultant
- Designer
- Workshop Representative
- Technical Manager
- QC

Project roles are independent from organization roles.

A person may have:

Organization Role:
Manager

Project Role:
Workshop Representative

---

## 14. Project Stages

A project moves through stages.

Initial conceptual stages may include:

1. Definition
2. Consulting
3. Design
4. Technical Review
5. Tender
6. Selection
7. Production
8. QC
9. Delivery
10. Completion

The exact workflow may evolve.

Project participants and permissions may change according to the current stage.

---

## 15. Consultant Routing

After a customer defines and confirms a project, the project may enter the Consultant panel.

The Consultant evaluates the project and decides its next route.

Possible routes include:

- Design
- Technical Review
- Tender
- Specialist Review
- Workshop
- Other project-specific routes

Routing decisions must be stored as project history.

The Consultant is therefore a decision/routing actor, not merely a chat participant.

---

## 16. Triangle System

The Triangle system represents the active collaboration structure between project actors.

Triangles are stage-aware.

The active participants may change as the project moves through stages.

Example:

Definition:

Customer + Consultant

Design:

Customer + Consultant + Designer

Production:

Customer + Workshop + Technical Manager

QC:

Workshop + Technical Manager + QC

Participants from previous stages should remain in project history even when their active participation ends.

---

## 17. Tender System

Tender is a project mechanism for obtaining offers from workshops.

Current foundation includes:

- Tender
- TenderParticipant
- Bid

Future tender functionality may include:

- sealed bids
- bid reveal
- ranking
- technical evaluation
- scoring
- top candidates
- award
- audit trail

Tender is downstream from project definition, consulting, and routing.

---

## 18. Design Principle: Complexity on Demand

Woodopia must expose only the complexity required by the current user and task.

A normal customer should see a simple customer interface.

A workshop manager should see workshop management tools.

A designer should see design tools.

A consultant should see project routing and decision tools.

An administrator should see verification and governance tools.

The underlying architecture may be complex while the user experience remains simple.

---

## 19. Identity Principle

One person = one User account.

Do not create duplicate accounts when a person:

- becomes a designer
- joins a workshop
- leaves a workshop
- joins another workshop
- participates in a project
- becomes a consultant

Use Memberships and Project Assignments instead.

---

## 20. Data Integrity Principle

Historical relationships must not be destroyed when current roles change.

Example:

Ali was Manager of Workshop A.

Ali leaves.

Hassan becomes Manager.

The system must preserve:

- Ali's historical membership
- Hassan's current membership
- Workshop A identity
- previous projects
- project history
- audit records

---

## 21. Development Order

Foundation:

1. User
2. User Profile
3. Reputation / Level
4. Organization
5. Organization Application
6. Membership
7. Organization Role
8. Permission
9. Review Log

Project Foundation:

10. Project Participant
11. Project Role
12. Project Stage

Workflow:

13. Consultant Routing
14. Triangle
15. Tender

Later systems:

16. Chat
17. Tasks
18. Files
19. Contracts
20. Payments
21. Notifications
22. Audit Logs
23. Automation
24. AI

---

## 22. Current Development Rule

Do not implement advanced Tender, Triangle, Chat, AI, or automation features before the Identity, Organization, Membership, Role, Permission, and Project foundation is stable.

Database structure should be designed for long-term expansion before implementation of dependent modules.