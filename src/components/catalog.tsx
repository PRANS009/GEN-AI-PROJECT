import {
  BookOpen,
  BriefcaseBusiness,
  GraduationCap,
  ShoppingBag,
  Table2,
  KeyRound,
  Database,
  GitFork,
} from "lucide-react";
import Link from "next/link";
import datasets from "../../content/datasets.json";

const icons = [GraduationCap, BriefcaseBusiness, ShoppingBag, BookOpen];
export function Catalog() {
  return (
    <div className="catalog">
      {datasets.map((d, i) => {
        const Icon = icons[i];
        return (
          <Link
            href={`/workspace?database=${d.id}`}
            key={d.id}
            className={`dataset ${d.color}`}
          >
            <div className="tile-top">
              <span className="tile-icon">
                <Icon size={24} strokeWidth={1.6} />
              </span>
              <span className="category">{d.category}</span>
            </div>
            <h3>{d.title}</h3>
            <p>{d.description}</p>
            <div className="tile-foot">
              <Table2 size={14} />
              {d.tables.length} tables
            </div>
          </Link>
        );
      })}
    </div>
  );
}
export function Blueprint() {
  return (
    <div
      className="blueprint"
      role="img"
      aria-label="Students and courses are related through enrolments"
    >
      <div className="wire w1" />
      <div className="wire w2" />
      <div className="entity e1">
        <div>
          <Database size={13} /> students
        </div>
        <small>
          <KeyRound size={10} /> id
        </small>
        <small>name</small>
      </div>
      <div className="entity e2">
        <div>
          <GitFork size={13} /> enrolments
        </div>
        <small>student_id</small>
        <small>course_id</small>
      </div>
      <div className="entity e3">
        <div>
          <Database size={13} /> courses
        </div>
        <small>
          <KeyRound size={10} /> id
        </small>
        <small>title</small>
      </div>
    </div>
  );
}
