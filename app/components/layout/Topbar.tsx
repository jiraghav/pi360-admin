"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useSelectedPatient } from "../SelectedPatientProvider";
import { getEmrNotifications, getLawyerTasks } from "@/lib/lawyer-notifications";
import { subscribeToNotificationRefresh } from "@/app/components/PusherNotifications";
import { getPatientsPage, type PatientListItem } from "@/lib/patients";
import { createWorkspacePatientFromListItem, formatWorkspaceDate } from "@/lib/workspace";

const pageConfig: Record<string, { title: string; subtitle: string }> = {
  "/": {
    title: "Dashboard",
    subtitle: "Unified Affiliate + EMR prototype based on your screenshots",
  },
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Unified Affiliate + EMR prototype based on your screenshots",
  },
  "/patients": {
    title: "Patients",
    subtitle: "Collapsed list + expanded patient update + one-click actions",
  },
  "/facilities": {
    title: "Facilities",
    subtitle: "Facility profiles + schedules + permissions + assets",
  },
  "/emails": {
    title: "Emails",
    subtitle:
      "Templates for treatment status requests + weekly reports + onboarding",
  },
  "/reports": {
    title: "Reports",
    subtitle:
      "Generate reports, invoices, and preview recommendations/signature",
  },
  "/settings": {
    title: "Settings",
    subtitle: "Prototype controls + parity checklist",
  },
  "/workspace": {
    title: "Patient Workspace",
    subtitle: "EMR view with the same components, reorganized to be simple",
  },
  "/lawyer-notifications": {
    title: "Lawyer Notifications",
    subtitle: "OpenEMR-style notification worklist with filters and patient actions",
  },
  "/affiliate-notifications": {
    title: "Affiliate Notifications",
    subtitle: "OpenEMR-style affiliate notification worklist with filters and actions",
  },
  "/emr-notifications": {
    title: "EMR Notifications",
    subtitle: "Unread OpenEMR notifications with patient and task context",
  },
  "/doctor-requests": {
    title: "Doctor Requests",
    subtitle: "OpenEMR-style doctor request worklist with filters and actions",
  },
  "/authorization-tasks": {
    title: "Authorization Tasks",
    subtitle: "OpenEMR authorization task worklist with filters and actions",
  },
  "/new-referrals": {
    title: "New Referrals",
    subtitle: "OpenEMR referral worklist with filters and actions",
  },
  "/location-requests": {
    title: "Location Requests",
    subtitle: "OpenEMR location request worklist with filters and actions",
  },
  "/record-requests": {
    title: "Record Requests",
    subtitle: "OpenEMR record request worklist with filters and actions",
  },
  "/reduction-submissions": {
    title: "Reduction Submissions",
    subtitle: "OpenEMR reduction submission worklist with filters and actions",
  },
};

export default function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const config = pageConfig[pathname] || pageConfig["/"];
  const { selectedPatient, selectPatient, clearSelectedPatient } = useSelectedPatient();
  const [lawyerNotificationsCount, setLawyerNotificationsCount] = useState(0);
  const [affiliateNotificationsCount, setAffiliateNotificationsCount] = useState(0);
  const [emrNotificationsCount, setEmrNotificationsCount] = useState(0);
  const [doctorRequestsCount, setDoctorRequestsCount] = useState(0);
  const [authorizationTasksCount, setAuthorizationTasksCount] = useState(0);
  const [newReferralsCount, setNewReferralsCount] = useState(0);
  const [locationRequestsCount, setLocationRequestsCount] = useState(0);
  const [recordRequestsCount, setRecordRequestsCount] = useState(0);
  const [reductionSubmissionsCount, setReductionSubmissionsCount] = useState(0);
  const [patientSearch, setPatientSearch] = useState("");
  const [patientSearchResults, setPatientSearchResults] = useState<PatientListItem[]>([]);
  const [patientSearchLoading, setPatientSearchLoading] = useState(false);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const patientSearchInputRef = useRef<HTMLInputElement | null>(null);

  const openLawyerNotifications = useMemo(
    () => lawyerNotificationsCount,
    [lawyerNotificationsCount],
  );
  const openAffiliateNotifications = useMemo(
    () => affiliateNotificationsCount,
    [affiliateNotificationsCount],
  );
  const openEmrNotifications = useMemo(() => emrNotificationsCount, [emrNotificationsCount]);
  const openDoctorRequests = useMemo(() => doctorRequestsCount, [doctorRequestsCount]);
  const openAuthorizationTasks = useMemo(() => authorizationTasksCount, [authorizationTasksCount]);
  const openNewReferrals = useMemo(() => newReferralsCount, [newReferralsCount]);
  const openLocationRequests = useMemo(() => locationRequestsCount, [locationRequestsCount]);
  const openRecordRequests = useMemo(() => recordRequestsCount, [recordRequestsCount]);
  const openReductionSubmissions = useMemo(() => reductionSubmissionsCount, [reductionSubmissionsCount]);

  const fetchNotificationCounts = useCallback(async () => {
    try {
      const [
        lawyerNotifications,
        affiliateNotifications,
        emrNotifications,
        doctorRequests,
        authorizationTasks,
        newReferrals,
        locationRequests,
        recordRequests,
        reductionSubmissions,
      ] = await Promise.all([
        getLawyerTasks({ page: 1, pageSize: 1, type: 1, status: "99" }),
        getLawyerTasks({ page: 1, pageSize: 1, type: 4, status: "99" }),
        getEmrNotifications({ page: 1, pageSize: 1, readStatus: "0" }),
        getLawyerTasks({ page: 1, pageSize: 1, type: 3, status: "99" }),
        getLawyerTasks({ page: 1, pageSize: 1, type: 2, authorization: 1, status: "99" }),
        getLawyerTasks({ page: 1, pageSize: 1, type: 1, title: "New Referral", status: "99" }),
        getLawyerTasks({ page: 1, pageSize: 1, type: 1, title: "New Location Request%", status: "99" }),
        getLawyerTasks({ page: 1, pageSize: 1, type: 1, title: "%Record Request from Back Office%", status: "99" }),
        getLawyerTasks({ page: 1, pageSize: 1, type: 1, title: "%Lawyer submitted reduction%", status: "99" }),
      ]);

      setLawyerNotificationsCount(lawyerNotifications.totalItems);
      setAffiliateNotificationsCount(affiliateNotifications.totalItems);
      setEmrNotificationsCount(emrNotifications.totalItems);
      setDoctorRequestsCount(doctorRequests.totalItems);
      setAuthorizationTasksCount(authorizationTasks.totalItems);
      setNewReferralsCount(newReferrals.totalItems);
      setLocationRequestsCount(locationRequests.totalItems);
      setRecordRequestsCount(recordRequests.totalItems);
      setReductionSubmissionsCount(reductionSubmissions.totalItems);
    } catch (error) {
      console.error("Failed to load notification counts:", error);
    }
  }, []);

  useEffect(() => {
    const refreshCounts = () => {
      void fetchNotificationCounts();
    };

    const initialLoadId = window.setTimeout(() => {
      refreshCounts();
    }, 0);

    const intervalId = window.setInterval(() => {
      refreshCounts();
    }, 60000);
    const unsubscribe = subscribeToNotificationRefresh(refreshCounts);

    return () => {
      window.clearTimeout(initialLoadId);
      window.clearInterval(intervalId);
      unsubscribe();
    };
  }, [fetchNotificationCounts]);

  useEffect(() => {
    const search = patientSearch.trim();

    if (search.length < 2) {
      setPatientSearchResults([]);
      setPatientSearchLoading(false);
      return;
    }

    let isMounted = true;
    setPatientSearchLoading(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        const data = await getPatientsPage({
          page: 1,
          pageSize: 6,
          search,
        });

        if (!isMounted) {
          return;
        }

        setPatientSearchResults(data.patients);
        setPatientSearchOpen(true);
      } catch (error) {
        console.error("Failed to search patients:", error);

        if (isMounted) {
          setPatientSearchResults([]);
        }
      } finally {
        if (isMounted) {
          setPatientSearchLoading(false);
        }
      }
    }, 250);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [patientSearch]);

  useEffect(() => {
    const handleFocusPatientSearch = () => {
      setPatientSearchOpen(true);
      patientSearchInputRef.current?.scrollIntoView({
        block: "center",
        inline: "nearest",
      });
      patientSearchInputRef.current?.focus();
    };

    window.addEventListener("pi360:focus-patient-search", handleFocusPatientSearch);

    return () => {
      window.removeEventListener("pi360:focus-patient-search", handleFocusPatientSearch);
    };
  }, []);

  const handleCloseWorkspace = () => {
    clearSelectedPatient();
    router.push("/patients");
  };

  const handleSelectPatientSearchResult = (patient: PatientListItem) => {
    selectPatient(createWorkspacePatientFromListItem(patient));
    setPatientSearch("");
    setPatientSearchResults([]);
    setPatientSearchOpen(false);
    router.push("/workspace");
  };

  const handlePatientSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (patientSearchResults.length > 0) {
      handleSelectPatientSearchResult(patientSearchResults[0]);
      return;
    }

    const search = patientSearch.trim();
    if (search) {
      router.push(`/patients?search=${encodeURIComponent(search)}`);
    }
  };

  return (
    <>
      <div className="topbar">
        <div className="crumb">
          <div className="h">{config.title}</div>
          <div className="s">{config.subtitle}</div>
        </div>

        <form className="searchbar nav-patient-search" onSubmit={handlePatientSearchSubmit}>
          <span aria-hidden="true">{"\u{1F50E}"}</span>
          <input
            ref={patientSearchInputRef}
            aria-label="Search patients"
            autoComplete="off"
            onBlur={() => {
              window.setTimeout(() => setPatientSearchOpen(false), 150);
            }}
            onChange={(event) => {
              setPatientSearch(event.target.value);
              setPatientSearchOpen(true);
            }}
            onFocus={() => setPatientSearchOpen(true)}
            placeholder="Search patients..."
            value={patientSearch}
          />
          {patientSearchOpen && patientSearch.trim().length >= 2 && (
            <div className="nav-search-results">
              {patientSearchLoading && (
                <div className="nav-search-empty">Searching patients...</div>
              )}
              {!patientSearchLoading && patientSearchResults.length === 0 && (
                <div className="nav-search-empty">No patients found.</div>
              )}
              {!patientSearchLoading && patientSearchResults.map((patient) => (
                <button
                  className="nav-search-result"
                  key={`${patient.pid ?? patient.uuid ?? patient.name}-${patient.dob ?? "no-dob"}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelectPatientSearchResult(patient)}
                  type="button"
                >
                  <span className="nav-search-result-name">{patient.name || "Unnamed patient"}</span>
                  <span className="nav-search-result-meta">
                    DOB {formatWorkspaceDate(patient.dob)} · DOI {formatWorkspaceDate(patient.doi)}
                    {patient.facility ? ` · ${patient.facility}` : ""}
                  </span>
                </button>
              ))}
            </div>
          )}
        </form>

        <div className="top-actions">
          <Link
            className="btn secondary"
            href={selectedPatient ? "/workspace" : "/patients"}
            aria-disabled={!selectedPatient}
            title={selectedPatient ? `Open ${selectedPatient.name}` : "Select a patient first"}
            style={!selectedPatient ? { opacity: 0.6 } : undefined}
          >
            {"\u{1F9FE}"} <span>{selectedPatient ? "Open EMR" : "Select Patient"}</span>
          </Link>
          <button className="btn">
            {"\u2795"} <span>New Task</span>
          </button>
          <Link
            className="iconbtn"
            href="/lawyer-notifications"
            title={`${openLawyerNotifications} open lawyer notifications`}
          >
            {"\u{1F514}"}
          </Link>
        </div>
      </div>
      <div className="notif-strip">
        <Link className="pill notification-pill" href="/lawyer-notifications">
          Lawyer Notifications <strong id="lawyerNotif">({openLawyerNotifications})</strong>
        </Link>
        <Link className="pill notification-pill" href="/affiliate-notifications">
          Affiliate Notifications <strong id="affNotif">({openAffiliateNotifications})</strong>
        </Link>
        <Link className="pill notification-pill" href="/emr-notifications">
          EMR Notifications <strong id="emrNotif">({openEmrNotifications})</strong>
        </Link>
        <Link className="pill notification-pill" href="/doctor-requests">
          Doctor Requests <strong id="docReq">({openDoctorRequests})</strong>
        </Link>
        <Link className="pill notification-pill" href="/authorization-tasks">
          Authorization Tasks <strong id="authTasks">({openAuthorizationTasks})</strong>
        </Link>
        <Link className="pill notification-pill" href="/new-referrals">
          New Referrals <strong>({openNewReferrals})</strong>
        </Link>
        <Link className="pill notification-pill" href="/location-requests">
          Location Requests <strong>({openLocationRequests})</strong>
        </Link>
        <Link className="pill notification-pill" href="/record-requests">
          Record Requests <strong>({openRecordRequests})</strong>
        </Link>
        <Link className="pill notification-pill" href="/reduction-submissions">
          Reduction Submissions <strong>({openReductionSubmissions})</strong>
        </Link>
        <div className="spacer"></div>
        <div className="pill" title="Selected patient">
          Patient:{" "}
          <strong id="selectedPatientPill">
            {selectedPatient ? selectedPatient.name : "Not selected"}
          </strong>
          {selectedPatient && (
            <button
              type="button"
              onClick={handleCloseWorkspace}
              title="Close patient workspace"
              aria-label="Close patient workspace"
              style={{
                marginLeft: "8px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                padding: 0,
                fontSize: "14px",
                lineHeight: 1,
                color: "inherit",
              }}
            >
              {"\u00D7"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
